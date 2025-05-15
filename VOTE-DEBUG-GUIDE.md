# Vote Cancellation Debugging Guide

I've added extensive debugging to help identify and fix issues with the vote cancellation feature. This guide will help you analyze the problem.

## Debugging Flow

I've added console logs throughout the voting flow to track exactly where the issue might be occurring:

1. **In VotePage.tsx:**
   - `handleCancelVote` - Logs when the cancel button is clicked
   - `useEffect` - Logs when vote state changes are detected

2. **In VotingContext.tsx:**
   - `cancelVote` - Extensive logging through each step of the cancellation process
   - `fetchVotes` - Logs the votes being fetched after cancellation

3. **In VoteCard.tsx:**
   - `completeCancellation` - Logs when the long-press cancellation is triggered

## How to Debug

1. **Open the browser DevTools** (F12 or right-click and select "Inspect")
2. **Go to the Console tab**
3. **Test vote cancellation** using both methods:
   - Click the "Cancel Vote" button
   - Long-press on the voted DJ card for 3.5+ seconds

4. **Look for these key log messages:**
   - `HANDLE CANCEL VOTE CALLED` - When the button is clicked
   - `VOTE CARD: completeCancellation called` - When long-press is completed
   - `CANCEL VOTE FUNCTION CALLED` - When the VotingContext method is called
   - `DELETING VOTE FROM DATABASE` - When the delete operation begins
   - `DELETE VOTE RESPONSE` - The response from Supabase after deletion
   - `VOTES FETCHED` - The votes fetched after cancellation
   - `USER VOTE AFTER REFRESH` - The user's vote status after refreshing

## Common Issues and Solutions

### 1. Vote not being deleted from database

**Symptoms:**
- `DELETE VOTE RESPONSE` shows an error or empty data
- `USER VOTE AFTER REFRESH` still shows a vote

**Potential fixes:**
- Check RLS (Row Level Security) policies in Supabase
- Verify the user has permission to delete their vote
- Check if there are triggers or functions preventing deletion

### 2. Vote deleted but UI not updating

**Symptoms:**
- `DELETE VOTE RESPONSE` shows success
- `USER VOTE AFTER REFRESH` shows no vote
- But the UI still shows as voted

**Potential fixes:**
- Check React state management in VotePage
- Verify the userVote state is properly updated after fetchVotes
- Check if there's a race condition in state updates

### 3. Event chain breaking

**Symptoms:**
- Some logs appear but others don't
- Process starts but doesn't complete

**Potential fixes:**
- Look for exceptions or rejected promises
- Check if asynchronous flow is properly handled
- Verify all event handlers are connected correctly

## Database Schema Troubleshooting

The vote cancellation could be affected by:

1. **RLS Policies** - Check if users can delete their own votes
2. **Foreign Key Constraints** - May prevent deletion if referenced elsewhere
3. **Triggers** - Could be preventing deletion or adding additional logic

## Examining the Data

After collecting logs, look for:

1. **Inconsistencies** between what's in the database and what's in the UI
2. **Error messages** that might indicate permission issues
3. **Vote ID** consistency across different log messages

## Next Steps

After identifying the issue, you can:

1. Update RLS policies if needed
2. Fix any React state management issues
3. Modify the cancellation flow if there are logic errors
4. Add additional error handling where the process is breaking down

## Supabase SQL Helper

For checking RLS policies, run this in Supabase SQL Editor:

```sql
-- Check RLS policies on votes table
SELECT * FROM pg_policies WHERE tablename = 'votes';

-- Check recent vote cancellations in logs (if you have enabled audit logs)
SELECT * FROM auth.audit_log_entries 
WHERE payload->>'action' = 'DELETE' 
AND payload->>'table' = 'votes' 
ORDER BY created_at DESC LIMIT 10;
``` 