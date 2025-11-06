import { RRule } from 'rrule';
import { parseISO, format, addDays, startOfDay } from 'date-fns';

/**
 * Generates all viewable event instances for a given date range
 * from a master list of base events and exceptions.
 * * @param {Array} allDbEvents - The raw list of all events from our backend.
 * @param {Date} viewStartDate - The first day of the view (e.g., start of week).
 * @param {Date} viewEndDate - The last day of the view (e.g., end of week).
 * @returns {Array} - A flat list of event objects to be rendered.
 */
export const generateRecurringInstances = (allDbEvents, viewStartDate, viewEndDate) => {
  const instances = [];
  const exceptionsByRecurId = {};
  const baseEvents = [];

  // 1. Separate base events from simple events and map exceptions
  allDbEvents.forEach(event => {
    if (event.recurrenceId) {
      if (event.isBaseEvent) {
        baseEvents.push(event);
      } else {
        // This is an exception (modified) or a deleted instance (ghost)
        if (!exceptionsByRecurId[event.recurrenceId]) {
          exceptionsByRecurId[event.recurrenceId] = {};
        }
        // Key exceptions by their *original* date
        if (event.originalDate) {
          exceptionsByRecurId[event.recurrenceId][event.originalDate] = event;
        }
      }
    } else {
      // It's a normal, non-recurring event.
      // Check if it's within our view range.
      const eventDate = startOfDay(parseISO(event.date));
      if (eventDate >= viewStartDate && eventDate <= viewEndDate) {
        instances.push(event);
      }
    }
  });

  // 2. Generate instances for each base event
  baseEvents.forEach(baseEvent => {
    const exceptions = exceptionsByRecurId[baseEvent.recurrenceId] || {};
    
    // Parse the RRULE string. We must provide a DTSTART.
    const ruleOptions = RRule.parseString(baseEvent.recurrenceRule);
    ruleOptions.dtstart = parseISO(`${baseEvent.date}T${baseEvent.startTime}`);
    
    const rule = new RRule(ruleOptions);
    
    // Get all dates from the rule that fall within our view
    const dates = rule.between(viewStartDate, addDays(viewEndDate, 1)); // `between` is exclusive of end date

    dates.forEach(date => {
      // RRule returns dates in local time, format to YYYY-MM-DD
      const dateString = format(date, 'yyyy-MM-dd');

      if (exceptions[dateString]) {
        const exception = exceptions[dateString];
        // This instance was either modified or deleted
        
        if (!exception.isDeleted) {
          // It's a modified event. Add the exception object.
          // Its `date` property may be different from `dateString` if it was moved!
          const exceptionDate = startOfDay(parseISO(exception.date));
          if (exceptionDate >= viewStartDate && exceptionDate <= viewEndDate) {
            instances.push({
              ...baseEvent, // Inherit base properties
              ...exception, // Override with exception properties
              isInstance: true,
              isException: true,
            });
          }
        }
        // If `exception.isDeleted` is true, we do nothing.
        // This effectively "deletes" it from the view.

      } else {
        // It's a normal, unmodified instance. Create it from the base.
        instances.push({
          ...baseEvent,
          id: `${baseEvent.id}-${dateString}`, // Create a unique instance ID
          date: dateString, // Override the base event's start date
          originalDate: dateString, // So we can modify it later
          isInstance: true,
          isException: false,
        });
      }
    });
  });

  return instances;
};