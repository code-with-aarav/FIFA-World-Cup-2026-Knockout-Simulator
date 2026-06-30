# ⚽ FIFA World Cup 2026 Knockout Simulator

An interactive FIFA World Cup 2026 Knockout Stage simulator built with **React**, **Vite**, and **Express**. Create your own tournament bracket, predict match winners, visualize the complete knockout tree, and share your predictions with others using a unique shareable link.

> Simulate the road from the Round of 32 to the FIFA World Cup Champion.

---

## ✨ Features

- 🏆 Interactive FIFA World Cup 2026 knockout bracket
- ⚽ Predict winners for every knockout match
- 🌍 Team flags and country visualization
- 🔄 Automatic progression of winners to the next round
- 🎯 Champion selection
- 📤 Share your completed bracket with a unique link
- 📸 Export the bracket as an image
- 🌙 Light/Dark mode
- 📱 Responsive design for desktop and mobile devices
- ⚡ Fast development powered by Vite

---

## 🛠 Tech Stack

### Frontend

- React 19
- Vite
- HTML5
- CSS3
- JavaScript (ES Modules)

### Backend

- Node.js
- Express
- CORS

### Libraries

- html2canvas (Bracket export)
- concurrently (Run frontend & backend together)

---

## 📂 Project Structure

```
.
├── public/
│   ├── favicon.png
│   └── icons.svg
│
├── src/
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   ├── main.jsx
│   └── teamsData.js
│
├── server.js
├── package.json
├── vite.config.js
└── index.html
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm

---

### Installation

Clone the repository

```bash
git clone https://github.com/code-with-aarav/FIFA-World-Cup-2026-Knockout-Simulator.git
```

Navigate to the project directory

```bash
cd FIFA-World-Cup-2026-Knockout-Simulator
```

Install dependencies

```bash
npm install
```

---

## ▶️ Running the Project

Start both the React frontend and Express API together:

```bash
npm run dev
```

This starts:

- Vite development server
- Express share API server

---

## 📦 Available Scripts

| Command | Description |
|----------|-------------|
| `npm run dev` | Starts frontend and backend simultaneously |
| `npm run server` | Starts only the Express API |
| `npm run build` | Creates a production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run Oxlint |

---

## 🌐 Share API

The Express server provides a lightweight in-memory API for sharing tournament predictions.

### Create a Share

```
POST /api/share
```

Returns a unique share ID.

---

### Retrieve a Shared Bracket

```
GET /api/share/:id
```

Returns the saved bracket if it has not expired.

---

### Health Check

```
GET /api/health
```

---

## 📸 Export Bracket

The application supports exporting your completed tournament bracket as an image using **html2canvas**, making it easy to share predictions on social media or with friends.

---

## 🎮 How to Use

1. Open the simulator.
2. Select the winner of each Round of 32 match.
3. Winners automatically advance to the next stage.
4. Continue predicting through:
   - Round of 32
   - Round of 16
   - Quarter-finals
   - Semi-finals
   - Final
5. Choose your FIFA World Cup Champion.
6. Share or export your completed bracket.

---

## 🔮 Future Improvements

- Persistent database storage
- User authentication
- Multiple tournament presets
- Match statistics integration
- Live FIFA World Cup updates
- Bracket history
- Public prediction leaderboard
- Tournament analytics

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a new feature branch.

```bash
git checkout -b feature/my-feature
```

3. Commit your changes.

```bash
git commit -m "Add new feature"
```

4. Push to your branch.

```bash
git push origin feature/my-feature
```

5. Open a Pull Request.

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Aarav Mandhanya**

GitHub: https://github.com/code-with-aarav

---

## ⭐ Support

If you found this project useful, consider giving it a **Star** on GitHub. It helps others discover the project and supports future development.
