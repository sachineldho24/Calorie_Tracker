/**
 * WeekStrip — Horizontal day selector with completion dots.
 * Green dot = has logged entries, grey = no entries, active day = highlighted.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Colors from '../constants/Colors';
import { FontFamily } from '../constants/Theme';
import { getWeekDays, getDayInitial, formatDate } from '../lib/nutrition';

interface WeekStripProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  /** Dates (YYYY-MM-DD) that have at least one food entry logged. */
  loggedDates?: string[];
}

export default function WeekStrip({ selectedDate, onSelectDate, loggedDates = [] }: WeekStripProps) {
  const days = getWeekDays();
  const today = formatDate(new Date());
  const loggedSet = new Set(loggedDates);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {days.map((day) => {
        const dateStr = formatDate(day);
        const isActive = dateStr === selectedDate;
        const isToday = dateStr === today;
        const isLogged = loggedSet.has(dateStr);
        // Future days can't be logged
        const isFuture = dateStr > today;

        return (
          <TouchableOpacity
            key={dateStr}
            style={[styles.dayButton, isActive && styles.dayButtonActive]}
            onPress={() => onSelectDate(dateStr)}
            activeOpacity={0.7}
          >
            <Text style={[styles.dayInitial, isActive && styles.dayInitialActive]}>
              {getDayInitial(day)}
            </Text>
            <Text style={[styles.dayDate, isActive && styles.dayDateActive]}>
              {day.getDate()}
            </Text>
            {/* Completion dot */}
            {!isActive && !isFuture && (
              <View style={[
                styles.completionDot,
                isLogged ? styles.dotLogged : (isToday ? styles.dotToday : styles.dotMissed),
              ]} />
            )}
            {isActive && isLogged && <View style={styles.dotActiveLogged} />}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  dayButton: {
    width: 44,
    height: 64,
    borderRadius: 12,
    backgroundColor: Colors.surfaceCard,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    transform: [{ scaleY: 1.05 }],
  },
  dayInitial: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  dayInitialActive: { color: Colors.onPrimary },
  dayDate: {
    fontFamily: FontFamily.heading,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  dayDateActive: { color: Colors.onPrimary },
  completionDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    position: 'absolute',
    bottom: 6,
  },
  dotLogged: { backgroundColor: Colors.statusSuccess },
  dotToday: { backgroundColor: Colors.primary },
  dotMissed: { backgroundColor: Colors.surfaceContainerHigh },
  dotActiveLogged: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: Colors.onPrimary + '80',
    position: 'absolute', bottom: 6,
  },
});
