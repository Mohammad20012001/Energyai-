# Jordan Solar Architect

Welcome to the Jordan Solar Architect, a comprehensive toolkit for designing and analyzing solar PV systems tailored for the Jordanian market. This application combines physics-based calculators with advanced AI-powered tools to assist solar engineers and installers.

## Table of Contents

1.  [Project Tools Overview](#project-tools-overview)
    - [AI Tools](#1-ai-tools)
    - [Technical Calculators](#2-technical-calculators)
    - [Data & Reports](#3-data--reports)
2.  [API Key Requirements](#api-key-requirements)
3.  [Getting Started](#getting-started)

---

## Project Tools Overview

This project is divided into several powerful modules, accessible through the sidebar navigation.

### 1. AI Tools

These are advanced tools that leverage large language models (LLMs) to provide intelligent analysis and recommendations.

- **Smart Assistant (`/chat`)**:
  - **Functionality**: A comprehensive chat interface where you can ask questions in Arabic about solar system design.
  - **How it Works**: This assistant uses an AI Agent that understands your questions and automatically uses other tools (like the Design Optimizer or Wire Sizer) to find precise answers.
  - **Example**: You can ask it, "Design a solar system for me with a budget of 10,000 JOD in Amman," and it will use the Design Optimizer to generate a complete proposal.

- **Live Performance Simulation (`/live-simulation`)**:
  - **Functionality**: Creates a "digital twin" of a solar system to simulate its real-time power generation.
  - **How it Works**: It connects to a weather service for live data (temperature, cloud cover, UV index), then uses an AI model to analyze the system's performance, compare it to expected and ideal outputs, and provide recommendations in Arabic.
  - **API Dependency**: Yes, **WeatherAPI.com**.

- **AI Design Optimizer (`/design-optimizer`)**:
  - **Functionality**: The most powerful tool in the project. It designs a complete solar system from scratch based on your constraints.
  - **How it Works**: It takes inputs like budget, available area, and electricity bill value. The AI then analyzes thousands of possibilities to recommend the optimal design for the best financial return, complete with component details (panels, inverter, wiring) and the reasoning behind its choices.

---

### 2. Technical Calculators

These tools perform precise calculations based on standard engineering and physics formulas.

- **Integrated System Sizer (`/system-sizer`)**:
  - Determines the required number of panels and the appropriate inverter size based on your monthly energy consumption.

- **String Configuration (`/string-configuration`)**:
  - Helps you determine the optimal way to connect panels in series and parallel (Strings) to avoid common mistakes and maximize efficiency.

- **Area & Production Calculator (`/area-calculator`)**:
  - Calculates the maximum number of solar panels that can fit in a given area and estimates the total energy it will produce annually.

- **Financial Viability Calculator (`/financial-viability`)**:
  - Analyzes the financial return on your solar investment, calculating the payback period and expected profits over 25 years.

- **Wire Sizing Calculator (`/wire-sizing`)**:
  - Determines the appropriate copper wire cross-section (in mm²) to minimize power loss and ensure system safety.

---

### 3. Data & Reports

- **Pricing Data (`/pricing`)**:
  - Displays an estimated price list for major solar system components (panels, inverters, batteries) in the Jordanian market.

- **Comprehensive Report (`/report`)**:
  - Allows you to aggregate your results from all calculators onto a single page. You can then copy the results as a single, consolidated text report to share with clients or for your records.

---

## API Key Requirements

For the project to be fully functional, it relies on two external services that require API keys.

1.  **Google AI (Gemini Models)**:
    - **Purpose**: This is the core engine for all AI-powered tools (Smart Assistant, Simulation, Design Optimizer).
    - **Status**: **PRE-CONFIGURED**. The project uses the `GEMINI_API_KEY` that is automatically set up in the Firebase hosting environment. **No action is needed from you.**

2.  **WeatherAPI.com**:
    - **Purpose**: This service is essential for the "Live Simulation" tool to fetch real-time weather data.
    - **Status**: **CONFIGURED**. The API key you provided has been set in the `.env` file under the variable `WEATHER_API_KEY`. **No further action is needed from you.**

In summary, **all required API keys are already configured**, and the project is ready to use with all its features.

## Getting Started

1.  Navigate through the different tools using the sidebar.
2.  Start with the **AI Design Optimizer** for a high-level system design.
3.  Use the individual **Technical Calculators** for more specific calculations.
4.  Add results to the **Comprehensive Report** as you go.
5.  Use the **Smart Assistant** for any questions you have along the way.
