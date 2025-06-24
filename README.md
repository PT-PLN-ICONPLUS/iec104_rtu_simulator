# Iconics IEC104 RTU Simulator (Dynamic Version)

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

## Exporting and Importing

The exported and imported files are formatted in a ```json``` format, so you can use it in your own project. Example of exported ```json``` file and can be used to import:

```json
{
  "circuit_breakers": [{"id": "1745923955161","name": "EXPRESS_2","ioa_cb_status": 203,"ioa_cb_status_close": 2031,"ioa_cb_status_dp": 2032,"ioa_control_open": 508,"ioa_control_close": 507,"ioa_control_dp": 5071,"ioa_local_remote": 105,"is_sbo": false,"is_double_point": true,"remote": 0,"cb_status_open": 0,"cb_status_close": 0,"cb_status_dp": 0,"control_open": 0,"control_close": 0,"control_dp": 0}],
  "telesignals": [{"id": "1744709479696","name": "SPS_24DCF","ioa": 102,"value": 0,"interval": 5,"auto_mode": true}],
  "telemetries": [{"id": "1744709479605","name": "F_CB1","ioa": 1012,"unit": "A","value": 99,"scale_factor": 0.1,"min_value": 98,"max_value": 200,"interval": 1,"auto_mode": true}]
}
```



All the codes are written by [@ardanngrha](github.com/ardanngrha)
