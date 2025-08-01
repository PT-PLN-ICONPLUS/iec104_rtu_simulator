# Iconics IEC104 RTU Simulator (Dynamic Version)

This project is a simulator for a Remote Terminal Unit (RTU) that uses the IEC 60870-5-104 (IEC 104) protocol. It is designed to mimic the behavior of real-world devices in a SCADA (Supervisory Control and Data Acquisition) system, making it an excellent tool for development, testing, and training purposes.

This project especially built for PLN Icon PLus's GRITA project, which is a SCADA system for monitoring and controlling electrical grids in Indonesia.

The application features a FastAPI backend to handle the IEC 104 logic and a React frontend for a user-friendly interface to control and monitor the simulated devices.

## 📖 Table of Contents

- [Protocol and Application](#-protocol-and-application)
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Core Components](#-core-components)
- [Data Structure](#-data-structure)
- [Getting Started](#-getting-started)
- [Deployment](#️-deployment)
- [Author](#️-author)

## 🔌 Protocol and Application

### IEC 60870-5-104

The IEC 60870-5-104 protocol is an international standard for telecontrol and power system automation. It defines how to send basic control messages over a TCP/IP network. It is widely used in SCADA systems to allow a central control station (master) to communicate with remote field devices like RTUs (slaves) for monitoring and controlling geographically dispersed processes, such as an electrical grid.

### Application Function

This simulator acts as an RTU (slave). It allows you to dynamically create, configure, and manage simulated devices. A SCADA master system can connect to this simulator as if it were a physical RTU to:

- Read status data (Telesignals, Telemetry).
- Send control commands (e.g., open/close a Circuit Breaker).
- Test and validate the master system's configuration and logic.

## ✨ Features

- **Dynamic Configuration**: Add, remove, and edit components on the fly without restarting the application.
- **Web-Based UI**: Easy-to-use interface built with React for managing the simulation.
- **Data Persistence**: Export the current state of all components to a JSON file and import it later.
- **Containerized**: Easily run and deploy using Docker and Kubernetes.
- **Realistic Simulation**: Simulates key components of a power system substation.

## 🛠️ Tech Stack

- **Backend**: FastAPI (Python)
- **Frontend**: React (JavaScript)
- **IEC 104 Library**: MZ-automation lib60870 (A C library that requires a UNIX-based environment)
- **Containerization**: Docker
- **Orchestration**: Kubernetes

## 🧩 Core Components

The simulator supports several types of data points commonly found in SCADA systems.

### 1. Circuit Breaker

A Circuit Breaker is an automated electrical switch designed to protect an electrical circuit from damage caused by excess current.

**Logic**: The simulator allows a master to read the status of a breaker (Open, Closed, or Intermediate) and send commands to open or close it. It supports both single-point and double-point indication and control.

**Key Attributes**: `name`, `ioa_cb_status`, `ioa_control_open`, `ioa_control_close`, `is_double_point`.

### 2. Tap Changer

A Tap Changer is a mechanism in transformers used to regulate the output voltage to required levels.

**Logic**: This component simulates the tap position of a transformer. The master can read the current tap position and command it to move to a higher or lower tap, thus changing the voltage.

> **Note**: The Tap Changer component was not in the original JSON structure. A potential structure is suggested in the Data Structure section.

### 3. Telesignal (Digital Input)

A Telesignal represents a digital status point, typically a binary state (On/Off, True/False).

**Logic**: It reports a status value (0 or 1). The simulator can be configured to automatically toggle this value at a set interval to simulate changing conditions.

**Key Attributes**: `name`, `ioa`, `value`, `interval`, `auto_mode`.

### 4. Telemetry (Analog Input)

A Telemetry point represents an analog measurement, like voltage, current, or temperature.

**Logic**: It reports a floating-point value. The simulator can automatically generate values within a defined `min_value` and `max_value` range at a specified interval. A `scale_factor` can be applied to the value.

**Key Attributes**: `name`, `ioa`, `unit`, `value`, `min_value`, `max_value`, `interval`.

## 📂 Data Structure

The application state can be exported and imported using a single JSON file. This is useful for backups and for setting up specific simulation scenarios quickly.

The JSON object contains three main keys: `circuit_breakers`, `telesignals`, and `telemetries`.

### Example JSON

```json
{
  "circuit_breakers": [
    {
      "id": "1745923955161",
      "name": "EXPRESS_2",
      "ioa_cb_status": 203,
      "ioa_cb_status_close": 2031,
      "ioa_cb_status_dp": 2032,
      "ioa_control_open": 508,
      "ioa_control_close": 507,
      "ioa_control_dp": 5071,
      "ioa_local_remote": 105,
      "is_sbo": false,
      "is_double_point": true,
      "remote": 0,
      "cb_status_open": 0,
      "cb_status_close": 0,
      "cb_status_dp": 0,
      "control_open": 0,
      "control_close": 0,
      "control_dp": 0
    }
  ],
  "telesignals": [
    {
      "id": "1744709479696",
      "name": "SPS_24DCF",
      "ioa": 102,
      "value": 0,
      "interval": 5,
      "auto_mode": true
    }
  ],
  "telemetries": [
    {
      "id": "1744709479605",
      "name": "F_CB1",
      "ioa": 1012,
      "unit": "A",
      "value": 99,
      "scale_factor": 0.1,
      "min_value": 98,
      "max_value": 200,
      "interval": 1,
      "auto_mode": true
    }
  ],
  "tap_changers": [
    {
      "id": "1744709479999",
      "name": "TRF-1_TAP",
      "ioa_tap_position": 1050,
      "ioa_control_up": 601,
      "ioa_control_down": 602,
      "current_position": 5,
      "min_position": 1,
      "max_position": 10
    }
  ]
}
```

> **Note**: The `tap_changers` object is an example of how it could be structured.

## 🚀 Getting Started

### Prerequisites

- Docker
- Docker Compose

### How to Run Locally

The project must be run using Docker because it depends on a C library that compiles only on UNIX-based systems.

1. **Clone the repository**:

   ```bash
   git clone <your-repository-url>
   cd iec104_rtu_simulator
   ```

2. **Run with Docker Compose**:

   This single command will build the images and start the frontend and backend services.

   ```bash
   docker compose up --build -d
   ```

3. **Access the application**:
   - The React frontend will be accessible at `http://localhost:<react-port>`
   - The FastAPI backend will be running on `http://localhost:<fastapi-port>`

## ☁️ Deployment

### How to Deploy in Kubernetes

To deploy the simulator in a Kubernetes cluster, you can use the provided shell scripts. These scripts dynamically configure the image tag, host, and ports.

1. Access your cluster environment, for example via SSH, and clone the repository.

2. **Make the scripts executable**:

   ```bash
   chmod +x install.sh
   chmod +x uninstall.sh
   ```

### Installing

The `install.sh` script creates the necessary Kubernetes deployments and services.

**Usage**:

```bash
./install.sh <image-tag> <fastapi-port> <iec104-port> <fastapi-nodeport> <iec104-nodeport> <react-port> <react-nodeport> <fastapi-host>
```

**Example**:

This command deploys the application with image tag 1 and configures the various ports and the host.

```bash
./install.sh 1 6006 2451 30606 30451 4051 30051 10.14.73.59
```

### Uninstalling

The `uninstall.sh` script removes all Kubernetes resources associated with the application.

**Usage**:

```bash
./uninstall.sh <image-tag>
```

**Example**:

```bash
./uninstall.sh 1
```

## ✍️ Author

All codes are written by [@ardanngrha](https://github.com/ardanngrha)
