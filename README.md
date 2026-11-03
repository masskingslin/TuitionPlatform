# TuitionPlatform (React Web Application)

A modern tuition and coaching institute management platform rewritten from Android Jetpack Compose into React + TypeScript + Tailwind CSS with responsive desktop and mobile support.

## Key Features

- **Dual-Role Navigation**: Seamlessly switch between the **Student App** and the **Teacher Console**.
- **Student Portal**:
  - **Dashboard**: Enrolled batches, class timings, live meeting/classroom launcher, and center announcements.
  - **Attendance**: Dynamic overall attendance percentage and per-session history with colored statuses (Present, Absent, Late, Excused).
  - **Assignments**: Homework list with status tracking (Pending vs Submitted), evaluation scores, and interactive homework submission dialog.
  - **Fee Statements**: Invoice breakdown, payment deadlines, and interactive "Pay Now" checkout simulation.
- **Teacher Console**:
  - **Batches Overview**: Batch rosters, active student counts, schedules, and classroom links.
  - **Mark Attendance**: Interactive roll-call with Present (P), Absent (A), Late (L), and Excused (E) status chips, plus "Save & Notify Parents" action.
  - **Assignments Management**: Form to publish new assignments with due date, maximum score, and problem statements directly to batches.
  - **Fee Tracker**: Financial summary of collected vs pending dues, invoice records, and parent reminder dispatcher.

## Technology Stack

- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Build Tool**: Vite 6
