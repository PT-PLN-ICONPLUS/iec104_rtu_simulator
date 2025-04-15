# Iconics IEC104 Server Simulator (Dynamic Version)

When using your local computer, there is only one way to run this project and it's using **Docker**. The only reason it's because it needs a library from [MZ-automation](https://github.com/mz-automation/lib60870) that's run on UNIX based machine only.

## How to Run Locally (using Docker Compose)

You will need Docker and Docker Compose installed, then run this command.

```sh
  docker compose up --build -d
```

## How to Deploy in Kubernetes (Scada Nas Network)

You need to access Scada Nas network trough SSH, clone the repository, and just use shell scripts that i wrote.

The Docker image tag, host, and ports are dynamic so you can configure as you wanted.

First run this commands

```sh
chmod +x install.sh
chmod +x uninstall.sh
```

### Installing

Usage:

```sh
./install.sh <image-tag> <fastapi-port> <iec104-port> <fastapi-nodeport> <iec104-nodeport> <react-port> <react-nodeport> <fastapi-host>
```

Example:

```sh
./install.sh 1 6006 2451 30606 30451 4051 30051 10.14.73.59
```

### Uninstalling

Usage:

```sh
./uninstall.sh <image-tag>
```

Example:

```sh
./uninstall.sh 1
```

All the codes are written by [@ardanngrha](github.com/ardanngrha)
