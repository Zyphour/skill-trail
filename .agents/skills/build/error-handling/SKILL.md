---
name: error-handling
description: Designs what a system does when things go wrong, which errors to catch, what to retry, what to surface, and what to let crash. Use this whenever the user is writing try/except or error branches, adding retries or timeouts, asking how to handle a failure case, or dealing with code that swallows errors silently. Also use when a system fails in confusing ways or logs are useless during an incident. For finding the cause of a specific failure, use debugging.
license: MIT
---

# Error handling

Most error handling is written reflexively — wrap it, log it, move on, and that reflex produces
systems that fail silently and are impossible to debug. The decision to make for each failure is
not *how* to handle it but **whether you can do anything useful about it.**

If you cannot, do not catch it. A caught-and-logged exception that leaves the program in a wrong
state is worse than a crash, because the crash would have told you immediately.

## 1. Sort every failure into one of four kinds

| Kind | Example | Response |
| --- | --- | --- |
| **Expected** | Not found, validation failed, duplicate | Return it as a value. Not an exception — this is normal operation |
| **Transient** | Timeout, 503, connection reset, lock contention | Retry with backoff, then give up and report |
| **Programmer error** | Null where it cannot be null, broken invariant | Crash. Loudly. Do not handle |
| **Environmental** | Config missing, disk full, credentials invalid | Fail at startup if possible, not on first request |

The two most common mistakes are treating expected outcomes as exceptions, which makes normal
control flow expensive and noisy, and catching programmer errors, which hides the bug and lets
corrupted state spread.

**Done when:** every failure path in the code maps to one of these four.

## 2. Catch only what you can act on

Catch a specific error type, at the level that knows what to do about it. That level is often
much higher than where the error occurs.

- **Never catch broadly:** a bare `except`, `catch (Exception)`, or `catch {}` also swallows
  programmer errors, cancellations, and out-of-memory.
- **Never catch and continue with a default** unless the default is genuinely correct. Returning
  an empty list on a database timeout tells the caller "no results", which is a lie that
  propagates.
- **Never log and rethrow at every level.** You get the same error six times in the log with no
  extra information.

**Done when:** every catch block does something other than logging.

## 3. Preserve the cause

When you wrap an error, keep the original attached — `raise ... from e`, `%w`, `cause:`. An
error chain that loses its root is the reason incidents take hours instead of minutes.

Add context on the way up: what you were doing, with which identifiers. "Failed to sync order
88213 for tenant acme" is actionable; "sync failed" is not. Add the values you had, never the
secrets.

**Done when:** one log line at the boundary tells you what failed, for which entity, and why.

## 4. Retry only what is safe and transient

Retries convert a small outage into a large one when applied carelessly.

- **Only retry idempotent operations**, or ones with an idempotency key. Retrying a payment
  because the response timed out can charge twice, the request may well have succeeded.
- **Only retry transient errors.** A 400 retried five times is five identical failures.
- **Exponential backoff with jitter.** Fixed-interval retries from many clients synchronise and
  hammer a recovering service — the retry storm is often worse than the original fault.
- **Cap total attempts and total time**, and make both visible to the caller.
- **Fail fast when the dependency is down.** A circuit breaker beats a queue of doomed retries.

**Done when:** each retry has a stated reason it is safe.

## 5. Design what the user sees

Three different audiences need three different things from the same failure:

- **End user:** what happened in their terms, and what to do next. No stack trace, no error
  code alone.
- **Calling system:** a stable machine-readable code and whether to retry. See `api-design`.
- **You, at 3am:** the full chain, the identifiers, the request ID that ties it to a trace.

The request ID is the piece that gets forgotten and matters most: it is what lets a user report
and a log line meet.

**Done when:** a user report can be traced to the exact failure without guessing.

## 6. Fail in a safe state

- **Clean up on the error path too:** connections, locks, temp files, partial writes. Use the
  language's scope-based mechanism rather than manual cleanup in a catch.
- **Decide what partial success means.** If three of five items processed, is that success,
  failure, or a reported partial? Decide deliberately, the default is usually wrong.
- **Never leave a half-applied change.** Transaction, compensating action, or an idempotent
  design that tolerates re-running.

**Done when:** an error mid-operation leaves nothing inconsistent.

## Report

State which failures you handle and which you deliberately let propagate, what is retried and
why that is safe, and what a user sees for each. The failures you chose *not* to handle are the
part reviewers most need to see, because silence there reads as an oversight.
