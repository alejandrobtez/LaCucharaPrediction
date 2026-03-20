# 🥄 La Cuchara — AI-Powered Hospitality Optimization

### Smart Gastronomy and Demand Forecasting for the AZCA Business District (Madrid)

> **🚀 QUICK VIEW:** You can explore the core logic of the prediction models and data processing here: [**🤖 ai_pipeline/**](./ai_pipeline/)

---

## 📖 About the Project

**La Cuchara** (The Spoon) is an advanced technological solution designed to optimize the dining experience and operational management in the **AZCA business district**.

The project addresses the gap between restaurant supply and office worker demand. By combining **Computer Vision, Natural Language Processing (NLP), and Predictive Analytics**, it aims to drastically reduce food waste (*merma*) while eliminating "menu uncertainty" for thousands of daily workers.

---

## ☁️ Cloud Infrastructure & Authentication

The platform is built on a robust hybrid architecture, utilizing **Microsoft Azure** for AI heavy-lifting and **Firebase** for secure identity management.

*   **Identity Management:** Integrated **Firebase Authentication** to provide secure, seamless login/signup flows for both office workers and restaurant owners.
*   **AI Services:** Integration of **Azure OpenAI** for menu structuring and **Document Intelligence** for OCR.
*   **Data Persistence:** **Azure SQL Database** for relational data storage and **Blob Storage** for hosting menu images.

---

## 🧠 AI Pipeline & Entity Training

The heart of "La Cuchara" is its dual-stage AI pipeline, which transforms physical menus into actionable data and predicts future sales.

### 1. Smart Menu Digitization (OCR & NLP)
Hosteliers simply take a photo of their handwritten or printed menu boards.
*   **Extraction:** Azure Document Intelligence extracts raw text.
*   **Entity Training:** The model has been fine-tuned to achieve high precision in identifying specific entities such as **Dish Names, Prices, and Dietary Labels**.
*   **Structuring:** GPT-4o-mini categorizes dishes and identifies allergens to enable smart filtering.

### 2. Predictive Demand Model (XGBoost)
To prevent overproduction, the system predicts the number of servings needed.
*   **Contextual Variables:** The **XGBoost Regressor** analyzes historical sales cross-referenced with **weather conditions**, **Real Madrid matches at the Bernabéu stadium**, and local bank holidays.

---

## ⚙️ The Processing Engine (Python & Next.js)

The project architecture separates the user-facing application from the specialized data logic.

### 1. Frontend & Real-Time Interaction
Developed with **Next.js 14**, the app provides office workers with a "Crowd Traffic Light" (Semáforo de afluencia) to avoid peak-hour queues.

### 2. Backend & ETL Logic (`/ai_pipeline`)
The orchestration is managed by a Python-based flow:
1.  **Ingestion:** Detects new menu uploads in Azure Blob Storage.
2.  **Processing:** Sends data to the Custom AI Model for entity extraction.
3.  **Transformation:** Cleans and normalizes the data via **SQLAlchemy**.
4.  **Inference:** Runs the XGBoost model to generate demand forecasts.

---

## 🗄️ Persistence & Validation (SQL Server)

All structured menus, user preferences, and prediction results are stored in an **Azure SQL Database**. For project verification and data management, we use **Azure Data Studio** and **SSMS**.

*   **Data Integrity:** Relational models ensure that every dish is linked to its restaurant, price history, and predicted sales.
*   **Analytics:** The database allows for real-time queries to visualize consumption patterns across the AZCA district.

---

## ✨ Main Features

*   **🔐 Secure Access:** Role-based authentication via **Firebase** (User vs. Restaurant Admin).
*   **🛡️ Zero Friction:** No manual typing; a simple photo digitizes the entire restaurant offering instantly.
*   **🌍 Sustainability:** Significant reduction in food waste by aligning kitchen prep with AI-predicted demand.
*   **🚦 Live Occupancy:** A status system to help workers avoid queues and optimize their lunch break.
*   **🥗 Intelligent Filtering:** Advanced search for specific dietary needs (Celiac, Vegan, Keto) powered by NLP.

---

## 🛠️ Technologies Used

*   **Frontend:** Next.js 14 (App Router), Tailwind CSS, Framer Motion.
*   **Authentication:** Firebase Auth.
*   **AI/ML:** Azure Document Intelligence, Azure OpenAI (GPT-4o-mini), XGBoost.
*   **Data & Backend:** Azure SQL Database, SQLAlchemy, Python 3.9+.
*   **Infrastructure:** Azure AI Foundry / ML Studio.

---
*Project developed as part of the Master's Degree in AI & Big Data.*
