# CodeIDE Codespace

Welcome to the CodeIDE Codespace project! This project provides a powerful and flexible IDE-like environment in Dockerized containers, allowing developers to create, manage, and run coding projects seamlessly.

## Features

CodeIDE Container: A fully configured container running a modern development environment.
Proxy Server: Handles connections and proxies requests between the CodeIDE container and the client.
Session Management: Uses express-session for handling user sessions.
Terminal Integration: Allows users to run terminal commands inside the containerized environment.
File Operations: Manage files and directories within the workspace environment, including creating, reading, updating, and deleting files.

## Getting Started

### Prerequisites
Make sure you have the following installed on your machine:

- Docker
- Node.js (v16+)
- npm (Package manager)


### Setup
Clone the repository:

```
git clone https://github.com/Avik-creator/codeide-codespace.git
```

Install the Dependencies:

```
  cd codeide-codespace/codeide-container && npm install
  cd codeide-codespace/proxy-server && npm install
```

Run both of them using:

```
npm run dev
```

# Running the CodeIDE
Once you have the Docker containers running, the `Codeide-Container` will be available at `http://localhost:3000`, and the `Proxy Server` will be running on `http//localhost:3005`.You can start creating new codespaces that you need. 

# Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue if you find a bug or want to request a feature.


# Demo:

[Video Link](https://x.com/avikm744/status/1842055111314383191)




