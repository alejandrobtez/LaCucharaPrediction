🥄 La Cuchara — AI-Powered Hospitality Optimization
Smart Gastronomy and Demand Forecasting for the AZCA Business District
🚀 QUICK VIEW: You can explore the core logic of the prediction models and data processing here: 🤖 ai_pipeline/

📖 About the Project
La Cuchara (The Spoon) is an advanced technological solution designed to optimize the dining experience and operational management in AZCA, Madrid’s premier business district.

The project addresses the gap between restaurant supply and office worker demand. By combining Computer Vision, Natural Language Processing (NLP), and Predictive Analytics, it aims to drastically reduce food waste (merma) while eliminating "menu uncertainty" for thousands of daily diners.

☁️ Cloud Infrastructure (Azure)
The platform is built on a robust Microsoft Azure backbone, utilizing a hybrid architecture to handle both the user-facing web application and the heavy-lifting AI processes.

Fig 1. Azure Resource Group: Integration of Azure OpenAI for menu structuring, Document Intelligence for OCR, and Azure SQL for relational data persistence.

🧠 AI Pipeline & Demand Forecasting
The heart of "La Cuchara" is its dual-stage AI pipeline, which transforms physical menus into actionable data and predicts future sales.

1. Smart Menu Digitization (OCR & NLP)
Hosteliers simply take a photo of their handwritten or printed daily specials.

Extraction: Azure Document Intelligence extracts raw text.

Structuring: GPT-4o-mini categorizes dishes, identifies allergens, and infers ingredients to enable smart filtering for users (e.g., vegan, gluten-free).

2. Predictive Demand Model (XGBoost)
To prevent overproduction, the system predicts the number of servings needed for each dish.

Fig 2. The XGBoost Regressor analyzes historical sales data cross-referenced with external variables: Weather conditions, Real Madrid matches at the Bernabéu, and local bank holidays.

⚙️ The Processing Engine
The project architecture is divided into a high-performance frontend and a specialized data logic layer.

Frontend & Real-Time Interaction
Developed with Next.js 14, the app provides office workers with a "Crowd Traffic Light" (Semáforo de afluencia) to avoid peak-hour queues and explore menus in real-time.

Backend & ETL Logic
The ai_pipeline/ directory manages the lifecycle of data:

Scripts: Automated generation of synthetic data and OCR processing.

Database Models: Managed via SQLAlchemy for seamless Python-to-SQL communication.

Model Deployment: Endpoints hosted on Azure AI Foundry for real-time inference.

🗄️ Persistence & Validation (SQL Server)
All structured menus, user preferences, and prediction results are stored in an Azure SQL Database. This ensures data integrity and allows for complex analytical queries regarding consumption patterns in the AZCA area.

Fig 3. Validation of the structured menu table. Fields include dish descriptions, price, dietary tags, and the predicted demand vs. actual sales for continuous model retraining.

✨ Main Features
🛡️ Zero Friction for Owners: No manual typing required; a simple photo digitizes the entire restaurant offering.

🌍 Sustainability (Smart Inventory): Significant reduction in food waste by aligning kitchen prep with AI-predicted demand.

🚦 Live Occupancy: A "traffic light" system based on historical and real-time data to improve user flow.

🥗 Intelligent Filtering: Advanced search for specific dietary needs (Celiac, Vegan, Keto) powered by GPT-4o-mini ingredient inference.

🛠️ Technologies Used
Framework: Next.js 14 (App Router, TypeScript)

Styling: Tailwind CSS & Framer Motion

AI/ML: Azure Document Intelligence, Azure OpenAI (GPT-4o-mini), XGBoost.

Data & Backend: Azure SQL Database, SQLAlchemy, Python 3.9+.

Infrastructure: Azure ML Studio / AI Foundry.