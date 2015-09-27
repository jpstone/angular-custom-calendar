'use strict';

angular.module('calendarApp')
  .factory('CalendarService', ['$q', 'ApiService',
    function ($q, ApiService) {

    function getDayData(month) {
      var controllerMonth,
          day,
          leapYear,
          localDate,
          serverDate,
          monthDays,
          monthDaysFinal,
          firstDay,
          lastDay,
          previousMonth,
          previousMonthDays,
          previousMonthLastDayPlusOne,
          monthList,
          monthNames,
          monthIndex,
          forLoopConditional,
          i,
          o,
          server,
          local,
          dayNum,
          numberOfWeeks,
          deferred,
          allDays,
          allDay,
          lDate,
          lMonth,
          mdfDay,
          lYear,
          today,
          dayType,
          lastMonthDay,
          self,
          weekendCount,
          isLeap;

      // Initial object that is used to ultimately populate monthDaysFinal
      monthDays = {};

      controllerMonth = month;
      today = new Date();
      weekendCount = 0;

      // Key represents number returned by Date.getMonth(), and value is number
      // of days in month. Used by several functions below.
      monthList = {
        0: 31,
        2: 31,
        3: 30,
        4: 31,
        5: 30,
        6: 31,
        7: 31,
        8: 30,
        9: 31,
        10: 30,
        11: 31
      };

      // Used to match Date.getMonth() to number in order to Date.setMonth()
      monthIndex = {
        0: 1,
        1: 2,
        2: 3,
        3: 4,
        4: 5,
        5: 6,
        6: 7,
        7: 8,
        8: 9,
        9: 10,
        10: 11,
        11: 12
      };

      // Used to properly set the monthDaysFinal.monthName and populate the 
      // calendar's title
      monthNames = {
        0: 'January',
        1: 'February',
        2: 'March',
        3: 'April',
        4: 'May',
        5: 'June',
        6: 'July',
        7: 'August',
        8: 'September',
        9: 'October',
        10: 'November',
        11: 'December'
      };
      
      deferred = $q.defer();
      leapYear = new Date(controllerMonth).getFullYear();
      localDate = new Date(controllerMonth);

      // Defining structure for final object returned to calendar controller
      monthDaysFinal = {
        monthName: monthNames[localDate.getMonth()] + ', ' +
          localDate.getFullYear(),
        monthIndex: localDate.getMonth(), // Number representing Date.getMonth()
        monthYear: localDate.getFullYear(), // Same except for year
        weeks: []
      };

      // Find the month number of the previous month and store it in
      // previousMonth
      previousMonth = new Date(localDate);
      previousMonth.setMonth(previousMonth.getMonth() - 1);
      previousMonth = previousMonth.getMonth();

      // Check if url year/current year is a leap year
      isLeap = new Date(leapYear, 1, 29).getMonth() === 1;

      // Update the monthList with leap year data
      if (!isLeap) {
        monthList[1] = 28;
      } else {
        monthList[1] = 29;
      }

      // Create an array of numbers representing each day of the "current" month
      // (either the url month or actual current month)
      switch (localDate.getMonth()) {
        case 0:
          monthDays.currentMonth = _.range(1, 32);
          break;
        case 1:
          if (!isLeap) {
            monthDays.currentMonth = _.range(1, 29);
          } else {
            monthDays.currentMonth = _.range(1, 30);
          }
          break;
        case 2:
          monthDays.currentMonth = _.range(1, 32);
          break;
        case 3:
          monthDays.currentMonth = _.range(1, 31);
          break;
        case 4:
          monthDays.currentMonth = _.range(1, 32);
          break;
        case 5:
          monthDays.currentMonth = _.range(1, 31);
          break;
        case 6:
          monthDays.currentMonth = _.range(1, 32);
          break;
        case 7:
          monthDays.currentMonth = _.range(1, 32);
          break;
        case 8:
          monthDays.currentMonth = _.range(1, 31);
          break;
        case 9:
          monthDays.currentMonth = _.range(1, 32);
          break;
        case 10:
          monthDays.currentMonth = _.range(1, 31);
          break;
        case 11:
          monthDays.currentMonth = _.range(1, 32);
          break;
      }

      // So far we have {currentMonth: [1, 2, 3, 4, etc.]} in monthDays...begin
      // doing the same thing for previous & next months...final monthDays will
      // look like {previoiusMonth: [28, 29, 30...], currentMonth: [1, 2, 3...],
      // nextMonth: [1, 2, 3...]}
      monthDays.nextMonth = [];
      monthDays.previousMonth = [];

      // Find weekday first day of current month lands on
      localDate.setDate(1);
      firstDay = localDate.getDay();

      // Find weekday last day of current month lands on
      localDate.setDate(monthList[localDate.getMonth()]);
      lastDay = localDate.getDay();

      // "plusOne" used to set proper underscore.js range array, which needs to 
      // add one in order to get the correct number of days
      previousMonthLastDayPlusOne = monthList[previousMonth] + 1;
      previousMonthDays = _.range(1, previousMonthLastDayPlusOne);

      // This will populate monthDays.previousMonth if first day of current month
      // is not a Sunday
      forLoopConditional = _.last(previousMonthDays) - firstDay;
      for (i = _.last(previousMonthDays);
            i > forLoopConditional;
            i--) {
        monthDays.previousMonth
        .unshift(previousMonthDays.pop(_.last(previousMonthDays)));
      }

      // This will populate monthDays.nextMonth if last day of current month
      // is not a Saturday
      dayNum = 1;
      for (i = lastDay; i < 6; i++) {
        monthDays.nextMonth.push(dayNum);
        dayNum++;
      }

      // Take all days in monthDays object, add them together, divide by 7, in
      // order to get the number of weeks to be shown in the month display of
      // the calendar, which will ultimately be represented as <tr>s
      numberOfWeeks = (monthDays.previousMonth.length +
        monthDays.currentMonth.length +
        monthDays.nextMonth.length) / 7;

      // Push an empty array into monthDaysFinal.weeks, each array representing
      // one of the weeks calculated above
      for (i = 0; i < numberOfWeeks; i++) {
        monthDaysFinal.weeks.push([]);
      }

      lastMonthDay = _.last(monthDays.nextMonth);

      // Begin shifting out monthDays.previousMonth items and stuff them into
      // monthDaysFinal.weeks[index] one at a time until you've stuffed 7 of
      // them, then do it all over again until monthDays.previousMonth is empty.
      // Also add a couple other attributes like month and dayType
      while (monthDays.previousMonth.length > 0) {
        for (i = 0; i <= numberOfWeeks - 1; i++) {
          for (o = 0; o < 7; o++) {
            day = monthDays.previousMonth.shift();
            if (day) {
              if ((o === 0) || (o === 6)) {
                dayType = 'weekend';
              } else {
                dayType = 'weekday';
              }
              monthDaysFinal.weeks[i].push({
                day: day, 
                month: 'previousMonth',
                dayType: dayType
              });
            }
          }
        }
      }

      // Same thing as above, except for currentMonth
      while (monthDays.currentMonth.length > 0) {
        for (i = 0; i <= numberOfWeeks - 1; i++) {
          if (i === 0) {
            o = monthDaysFinal.weeks[i].length;
          } else {
            o = 0;
          }
          for (o; o < 7; o++) {
            day = monthDays.currentMonth.shift();
            if (day) {
              if ((o === 0) || (o === 6)) {
                dayType = 'weekend';
              } else {
                dayType = 'weekday';
              }
              monthDaysFinal.weeks[i].push({
                day: day,
                month: 'currentMonth',
                dayType: dayType
              });
            }
          }
        }
      }

      // Same thing as above, except for nextMonth
      while (monthDays.nextMonth.length > 0) {
        for (i = numberOfWeeks - 1; i === numberOfWeeks - 1; i++) {
          for (o = 0; o < 7; o++) {
            if (i === _.last(monthDaysFinal.weeks)[0] - 1) {
              o = monthDaysFinal.weeks[i].length;
            }
            day = monthDays.nextMonth.shift();
            if (day) {
              if ((o === 0) || (o = lastMonthDay - 1)) {
                dayType = 'weekend';
              } else {
                console.log(o);
                dayType = 'weekday';
              }
              monthDaysFinal.weeks[i].push({
                day: day,
                month: 'nextMonth',
                dayType: dayType
              });
            }
          }
        }
      }

      /**
      * Right now monthDaysFinal looks like this:
      * {
      *    monthName: 'January, 2014',
      *    monthIndex: 0,
      *    monthYear: 2014,
      *    weeks: [
      *      [
      *        {day: 30, month: previousMonth, cssStuff: ['blah', 'blah']},
      *        {day: 31, month: previousMonth, cssStuff: ['blah, blah']}
      *        x7 total
      *      ],
      *      [more stuff],
      *      [etc...],
      *      [etc...],
      *      [etc...]
      *   ]
      * }
      *
      */

      // Reset localDate variable for use below
      localDate = new Date(controllerMonth);

      // Pull all day data from server, run through each monthDayFinal day, set
      // the date for that day, storing it ultimately as a string in the "local"
      // var...do the same thing with the server data, storing it ultimately as
      // a string in the "server" var. If "local === server", then stuff the
      // serverData for that day into the monthDayFinal index, passing it to the
      // controller for use in the view template 
      ApiService.getAllDays().then(function (days) {
        allDays = angular.copy(days);
        monthDaysFinal.weeks.forEach(function (week) {
          angular.forEach(week, function (value, key) {
            mdfDay = value;
            allDays.forEach(function (day) {
              day = angular.copy(day);
              serverDate = new Date(day.day.date);
              lMonth = monthIndex[localDate.getMonth()];
              lYear = localDate.getFullYear();
              switch (mdfDay.month) {
                case 'previousMonth':
                  lDate = new Date(lMonth + '/1/' + lYear);
                  lDate.setMonth(lDate.getMonth() - 1);
                  lDate.setDate(mdfDay.day);
                  mdfDay.blockCss = ["calendarDay", "previousMonth"];
                  mdfDay.inlineCss = ["previousMonthDay"];
                  break;
                case 'currentMonth':
                  lDate = new Date(lMonth + '/' +
                    mdfDay.day + '/' + lYear);
                  mdfDay.blockCss = ["calendarDay", "currentMonth"];
                  mdfDay.inlineCss = ["currentMonthDay"];
                  break;
                case 'nextMonth':
                  lDate = new Date(lMonth + '/1/' + lYear);
                  lDate.setMonth(lDate.getMonth() + 1);
                  lDate.setDate(mdfDay.day);
                  mdfDay.blockCss = ["calendarDay", "nextMonth"];
                  mdfDay.inlineCss = ["nextMonthDay"];
                  break;
              }
              server = monthIndex[serverDate.getMonth()] + '/' +
                serverDate.getDate() +
                '/' + serverDate.getFullYear();
              local = monthIndex[lDate.getMonth()] + '/' +
                lDate.getDate() + '/' +
                lDate.getFullYear();

              if (server === local) {
                mdfDay.serverData = angular.copy(day);
                day.day.dayTypes.forEach(function (type) {
                  if (type.dayType === 'bic') {
                    mdfDay.dayCss = ['bicDay'];
                  }
                });
              }
              if (today.getMonth() === lDate.getMonth() &&
                today.getDate() === lDate.getDate() &&
                today.getFullYear() === lDate.getFullYear()) {
                if (mdfDay.dayCss) {
                  mdfDay.dayCss.push('today');              
                } else if (!mdfDay.dayCss) {
                  mdfDay.dayCss = ['today'];
                }
              }
            });
          });
        });

        ApiService.getAllMonths().then(function (months) {
          months = angular.copy(months);
          months.forEach(function (month) {
            serverDate = new Date(month.month);
            if (serverDate.getMonth() === localDate.getMonth() &&
              serverDate.getFullYear() === localDate.getFullYear()) {
              angular.forEach(month, function (value, key) {
                monthDaysFinal[key] = value;
              });
            }
          });
        monthDaysFinal.weeks.forEach(function (week) {
          week.forEach(function (day) {
            if (day.dayType === 'weekend' && day.month === 'currentMonth') {
              weekendCount++;
            }
          });
        });
        monthDaysFinal.weekendCount = weekendCount;
        deferred.resolve(monthDaysFinal);
        });
      }).catch(function (err) {
        console.log(err);
      });

      return deferred.promise;

    }

    // Public API here
    return {
      
      getDayData: function (month) {
        return getDayData(month);
      }

    };

  }]);
