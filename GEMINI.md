# TripFrame Project Context

## Project Overview
TripFrame is a travel planning and management application focused on providing travelers with a clear, reliable, and actionable timeline that proactively identifies logistical missing links. The core features revolve around "Gap Detection" and a "Reverse Calculation Engine".

**Key Features:**
- **Reverse Calculation Engine (P1):** Calculates the final recommended departure time by sequentially subtracting durations from a target anchor time (e.g., flight departure).
- **Gap Detection (P1):** Proactively identifies missing transport links between non-contiguous location-based events and provides suggestion cards.
- **Timeline UI:** A detailed daily view categorizing events by type (flight, hotel, transport, warning, free, prep) with status indicators (Derived, Missing, Auto).

**Current Phase:**
The project is currently in the initial setup and prototyping phase based on a JSX mockup (`TripFrame_mockup.jsx`) and a Functional Requirements Specification (`TripFrame_FRS_v0.1.docx`). It is planned to be built as a mobile application.

## Technologies and Architecture
- **Framework:** Expo (React Native)
- **Language:** TypeScript
- **Styling:** Tailwind CSS / NativeWind (Targeting a Dark Mode primary theme with Purple accents: `#A78BFA` on `#0F0F13`).
- **Data/Logic:** Custom TypeScript engines for Gap Detection and Reverse Time Calculation utilizing libraries like `date-fns`.

## Building and Running (Planned)
Currently, the directory contains the initial design and specification files. Once the Expo project is initialized, the following standard commands will apply:

- **Initialization (TODO):** `npx create-expo-app@latest . --template expo-template-blank-typescript`
- **Start Metro Bundler:** `npx expo start`
- **Run on Android:** `npx expo run:android`
- **Run on iOS:** `npx expo run:ios`

## Development Conventions
- **Component Design:** Prioritize functional components with clear typed props. Components should closely match the visual styling provided in `TripFrame_mockup.jsx`.
- **Logic Separation:** Keep the core business logic (`ReverseCalculationEngine`, `GapDetectionEngine`) separated from UI components for easier testing and maintainability.
- **Types:** Maintain strict TypeScript typing for all core data structures (`TripEvent`, `Gap`, `ReverseCalcResult`).
- **Styling:** Adhere to the established Dark Mode aesthetic first, ensuring high contrast and clear visual hierarchy before adapting a Light Mode.

## Key Files (Current Workspace)
- `TripFrame_mockup.jsx`: The source of truth for the initial UI design, color palette, and sample data structure.
- `TripFrame_FRS_v0.1.docx`: Functional Requirements Specification detailing the exact rules for the calculation and detection engines.
- `free_time_analysis_d1_d2.html`: Additional context or analysis regarding free time during the trip (Days 1 and 2).
