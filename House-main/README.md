# Tiwari House Expenses Tracker

A premium web application for managing household expenses with ease, specifically designed for the Tiwari family.

## Features
- **Data Entry**: Quick form to record expenses with automatic group assignment.
- **Dynamic Dashboard**: Real-time updates of total expenses, individual contributions, and group spending.
- **Settlement Logic**: Automatically calculates who needs to pay or receive money based on average share.
- **Visual Analytics**: Interactive bar charts for monthly trends and doughnut charts for category distribution.
- **Advanced Filtering**: Filter records by month or expense group.
- **Excel-like UI**: Clean, professional layout with responsive design.

## How to Run
1. Open `index.html` in any modern web browser.
2. Add your expenses using the "+ Add Expense" button.
3. Your data is automatically saved to your browser's local storage.

## Logic Overview
- **Balance Calculation**: `Individual Contribution - (Total Expenses / Number of Members)`.
- **Groups**: Automatically assigned based on the paid-by name (Technical, Logistics, etc., customizable in `app.js`).
- **Target Budget**: Set at ₹ 30,000 for "Gap" calculation.
