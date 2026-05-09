# Campus Notification System - Full Stack Assessment

Hey there! Here's my complete write-up and implementation breakdown for the Full Stack Developer Assessment. I've structured this repo to keep the Next.js frontend, Express backend, and the shared logging middleware totally decoupled but easy to run.

## What's Inside?
- **`notification_app_be`**: This is my Node/Express backend. It exposes the API endpoints and integrates the custom logging package.
- **`notification_app_fe`**: The Next.js web app. I built the UI using Material UI (with some glassmorphism tweaks so it doesn't look like a boring admin panel).
- **`logging_middleware`**: My custom npm package for standardized logging. It's written in TypeScript and handles pushing logs directly to the remote evaluation server.

---

### Booting Everything Up Locally

To test this out yourself, you just need your access code.

**1. Grab Your Token**
I wrote a quick script to handle the handshake automatically.
```bash
cd logging_middleware
# Create an .env file with your EMAIL, NAME, MOBILE_NO, GITHUB_USERNAME, ROLL_NO, and ACCESS_CODE
npm run register
```
That's it! It'll spit out an `APP_TOKEN` straight into the `.env` file.

**2. Copy the Tokens**
- Take that `APP_TOKEN` and drop it into `notification_app_be/.env`
- Also drop it into `notification_app_fe/.env.local` as `NEXT_PUBLIC_APP_TOKEN`

**3. Run the Dev Servers**
Spin up both servers in their respective folders:
```bash
# In one terminal
cd notification_app_be && npm run dev

# In another terminal
cd notification_app_fe && npm run dev
```

---

## Stage 1: API Design

Here’s how I structured the REST endpoints. I wanted to keep the payload clean and standard.

### 1. Grab Notifications
We need pagination out of the box because lists get huge fast.
- **GET** `/api/v1/notifications?page=1&limit=10&type=Event`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
```json
{
  "success": true,
  "payload": {
    "items": [
      {
        "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "category": "Placement",
        "body": "Google is visiting campus next week!",
        "createdAt": "2026-05-10T10:00:00Z",
        "hasRead": false
      }
    ],
    "meta": { "currentPage": 1, "pageSize": 10, "totalRecords": 450 }
  }
}
```

### 2. Mark Single Item as Read
- **PATCH** `/api/v1/notifications/:id/read`
```json
{ "success": true, "message": "Done." }
```

### 3. Clear All Unread
- **POST** `/api/v1/notifications/clear-unread`
```json
{ "success": true, "message": "Inbox cleared." }
```

---

## Stage 2: Database Architecture

**Why Postgres?**
Honestly, relational DBs are just built for this. Notifications are heavily relational (tied to students, specific events) and we need strict ACID compliance. Also, querying by ENUM types with proper indexes is blazingly fast in Postgres.

### The Schema
```sql
CREATE TYPE notif_category AS ENUM ('Event', 'Result', 'Placement');

CREATE TABLE student_notifications (
    uid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id INT NOT NULL,
    category notif_category NOT NULL,
    content TEXT NOT NULL,
    is_viewed BOOLEAN DEFAULT FALSE,
    posted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- This is the holy grail index for the most common query: fetching a user's unread inbox
CREATE INDEX idx_user_unread_timeline ON student_notifications(recipient_id, is_viewed, posted_at);
```

### Handling Massive Scale (Millions of Rows)
When this table gets massive, a few things will break. Here's my fix:
1. **Partitioning**: I'd partition the `student_notifications` table by month. Old partitions can literally just be ignored by active queries.
2. **Archiving**: Realistically, nobody checks a 2-year-old notification. Run a cron job to dump anything older than 6 months into AWS S3 (cold storage) and delete it from Postgres.
3. **Redis Caching**: Cache the `unread_count` per user in Redis. Hitting the DB just to show a little red badge on the UI is a waste of resources.

---

## Stage 3: Query Optimization

**The Problem Query:**
Fetching unread items by `student_id` sorting by `created_at`.
Is it accurate? Yes. Is it slow? Absolutely, especially at 5M rows.

**Why it chokes:**
Without a composite index, Postgres does a massive sequential scan, filtering out `isRead=false` and `student_id=xyz`, then dumps all that into memory to sort it.

**The Fix:**
I added a composite index earlier:
```sql
CREATE INDEX idx_user_unread_timeline ON student_notifications(recipient_id, is_viewed, posted_at);
```
**Trade-offs:** 
Adding indexes isn't free. This drops read times from O(N) to O(log N), but it adds write penalty. Every single insert now has to update the B-Tree.
Should we index every column? **No way.** Indexing a `message` column, for example, is pointless unless we are doing full-text search, and it'll bloat the DB storage significantly.

**Last 7 Days Placements Query:**
```sql
SELECT * FROM student_notifications
WHERE category = 'Placement' 
AND posted_at >= NOW() - INTERVAL '7 days';
```

---

## Stage 4: Real-time Performance

Constantly hitting F5 or running a polling script from the frontend is a surefire way to kill the database.

**My Approach:**
1. **Redis Cache (The Fast Lane):** Keep the top 20 recent notifications in Redis per active user. The frontend loads this instantly.
2. **Server-Sent Events (SSE):** Instead of WebSockets (which are overkill if we don't need bi-directional chat), SSE is perfect for just *pushing* new notifications down to the browser.
3. **Trade-offs:** Managing Redis cache invalidation is famously annoying. Also, maintaining open SSE connections requires tuning load balancers so they don't drop idle connections, plus running a pub/sub layer (like Redis PubSub) so multiple Node servers know when to push an event.

---

## Stage 5: System Reliability (Decoupling)

**The Flaw in the Original Logic:**
Looping through 50,000 students synchronously is a disaster. If the external email API goes down at student #342, the loop crashes. We just lost the state, the HR person's browser timed out, and no one knows who got the email.

**The Redesign: Event-Driven Architecture**
We need to decouple the database saving from the actual sending of emails.

```python
def dispatch_notifications(recipients, msg_body):
    # 1. Fast persistence: Bulk insert into Postgres immediately. 
    # Takes milliseconds.
    db.bulk_insert(recipients, msg_body)
    
    # 2. Drop the actual dispatch jobs into a Message Queue (like RabbitMQ)
    for target in recipients:
        message_broker.push("email_queue", { "to": target, "msg": msg_body })
        
    return "Queued 50,000 notifications successfully."

# --- Meanwhile, in a separate background worker cluster ---

def worker_process():
    while job = message_broker.pull("email_queue"):
        try:
            send_external_email(job.to, job.msg)
            job.mark_done()
        except NetworkDrop:
            # Drop it into a Dead Letter Queue or automatically retry in 5 mins
            job.schedule_retry()
```
This guarantees we never block the main thread and no notification is ever completely lost due to a flaky 3rd party API.

---

## Stage 6 & 7: Priority Inbox & Frontend

I implemented the algorithm in `priority_inbox.ts` and wired it up directly into the Next.js UI!

**How it works:**
The algorithm calculates a `priorityScore` dynamically.
- `Placement` gets a base of 300, `Result` 200, `Event` 100.
- It then decays based on the age of the notification (subtracting the hours elapsed).
- This means a super old Placement update will eventually fall behind a brand new Result update!

The frontend is fully functional on `localhost:3000`. I used Next.js Server Actions to safely securely proxy logs to the evaluation server to bypass the annoying browser CORS restrictions. You can switch between "All" and "Priority Inbox" seamlessly. Enjoy the new premium UI!
