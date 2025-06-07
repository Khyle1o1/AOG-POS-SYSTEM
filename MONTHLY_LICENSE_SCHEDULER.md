# Monthly License Scheduler

## Overview

The Monthly License Scheduler is a background service that automatically checks the license status once every month, but only when an internet connection is available. This system runs completely silently in the background without any user interface, designed for POS systems that run locally and may not always have internet access.

## Features

- **Monthly Checks**: Automatically validates license status every 30 days
- **Internet Awareness**: Only runs when internet connectivity is available
- **Silent Operation**: Runs completely in the background without any user interface
- **Efficient Scheduling**: Only checks when actually due, not on regular intervals
- **Offline Resilience**: Gracefully handles offline periods and retries when connection is restored
- **Missed Check Tracking**: Allows up to 3 missed monthly checks before issues
- **Electron Integration**: Communicates with the main process for logging and notifications

## How It Works

### 1. Initialization
The scheduler initializes when the application starts:
- Loads previous state from localStorage
- Sets up network status listeners
- Calculates and schedules the next check time

### 2. Network Monitoring
- Listens to browser `online` events
- When connection is restored, checks if a monthly validation is due
- Tests actual internet connectivity by attempting to reach the license server

### 3. Monthly Validation Process
When a monthly check is due and internet is available:
1. Tests internet connectivity to the license server
2. Calls `LicenseService.refreshLicense()` to validate the current license
3. Updates check timestamps and resets missed check counter on success
4. Schedules the next check for exactly 30 days later
5. If validation fails, retries in 24 hours
6. Notifies the Electron main process of results

### 4. Grace Period Management
- Allows up to 3 missed monthly checks (approximately 90 days offline)
- Tracks missed checks silently
- Resets missed check counter when a successful validation occurs

## Configuration

### Timing Constants
```typescript
const MONTHLY_INTERVAL = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_MISSED_CHECKS = 3; // Allow 3 missed checks
```

### Network Testing
The system tests connectivity by:
1. First attempting to reach the license server health endpoint
2. Falling back to a basic connectivity test (Google favicon)
3. Both tests have timeouts (5s and 3s respectively)

## Silent Operation

### No User Interface
- The scheduler runs completely silently
- No visible components or notifications to users
- No settings or controls exposed to administrators
- All operations logged to console for debugging

### Efficient Scheduling
- Uses `setTimeout` to schedule exact check times
- Only executes when a check is actually due
- No regular polling or hourly checks
- Minimal system resource usage

## Electron Integration

### IPC Communication
The scheduler communicates with the Electron main process via IPC:
- `monthly-license-check-success`: Successful validation
- `monthly-license-check-failed`: Failed validation

### Main Process Handling
The Electron main process can:
- Log license check events
- Perform additional administrative actions
- Log to files or external systems

## Storage and Persistence

The scheduler state is stored in localStorage:
```typescript
interface SchedulerState {
  lastMonthlyCheck: string | null;
  nextScheduledCheck: string | null;
  missedChecks: number;
}
```

## API Methods

### Public Methods
- `LicenseScheduler.initialize()`: Start the scheduler
- `LicenseScheduler.getStatus()`: Get current status (debugging only)
- `LicenseScheduler.reset()`: Reset all state
- `LicenseScheduler.cleanup()`: Stop the scheduler

### Status Response (Debug Only)
```typescript
{
  lastMonthlyCheck: string | null;
  nextScheduledCheck: string | null;
  missedChecks: number;
  isDue: boolean;
  maxMissedChecksReached: boolean;
}
```

## Error Handling

### Network Failures
- Gracefully handles network timeouts
- Distinguishes between network issues and license validation failures
- Retries in 24 hours if validation fails due to connectivity

### License Server Issues
- Falls back to basic connectivity testing if license server is unreachable
- Logs specific error messages for debugging
- Maintains offline operation capability

### Data Persistence
- Handles localStorage failures gracefully
- Continues operation even if state cannot be saved
- Maintains check schedule across app restarts

## Best Practices

### For Deployment
1. Ensure license server has a reliable `/api/health` endpoint
2. Configure appropriate server URLs in environment variables
3. Test the system in various network conditions
4. Monitor console logs for license check events

### For Administration
1. Monitor Electron main process logs for license events
2. Check console logs for scheduler activity
3. Verify license server accessibility for troubleshooting

### For Development
1. Test offline scenarios thoroughly
2. Verify IPC communication with Electron main process
3. Test network state changes during operation
4. Validate localStorage persistence across app restarts
5. Use browser dev tools to monitor console output

## Troubleshooting

### Common Issues

1. **Scheduler not initializing**
   - Check that it's called after app hydration
   - Verify localStorage access permissions
   - Check console for initialization logs

2. **Network detection issues**
   - Test license server health endpoint manually
   - Check CORS configuration for health endpoint
   - Verify internet connectivity testing fallback

3. **Missed checks accumulating**
   - Check license server availability
   - Verify network configuration
   - Monitor console logs for check attempts

4. **IPC communication failures**
   - Verify Electron preload script configuration
   - Check allowed IPC channels list
   - Test with Electron main process event handlers

### Debug Information
The scheduler logs all activities to the console:
- Initialization messages
- Check scheduling information
- Validation attempts and results
- Error conditions and retry scheduling

### Monitoring
Since the scheduler runs silently, monitor it through:
- Browser console logs
- Electron main process logs
- License server access logs
- localStorage state inspection 