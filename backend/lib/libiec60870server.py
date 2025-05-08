#!/usr/bin/env python3
import datetime
from .lib60870 import *
import time
import logging

logger = logging.getLogger(__name__)

class IEC60870_5_104_server:
    def __init__(self, host, port, ioa_list=None, socketio_server=None, circuit_breakers=None, telesignals=None, telemetries=None):
        self.clockSyncHandler = CS101_ClockSynchronizationHandler(self.clock)
        self.interrogationHandler = CS101_InterrogationHandler(self.GI_h)
        self.asduHandler = CS101_ASDUHandler(self.ASDU_h)
        self.connectionRequestHandler = CS104_ConnectionRequestHandler(self.connection_request)
        self.connectionEventHandler = CS104_ConnectionEventHandler(self.connection_event)
        self.readEventHandler = CS101_ReadHandler(self.read)
        self.socketio = socketio_server

        self.slave = CS104_Slave_create(100, 100)
        CS104_Slave_setLocalAddress(self.slave, host)
        CS104_Slave_setLocalPort(self.slave, port)
        #   /* Set mode to a single redundancy group
        CS104_Slave_setServerMode(self.slave, CS104_MODE_SINGLE_REDUNDANCY_GROUP)

        #/* get the connection parameters - we need them to create correct ASDUs */
        self.alParams = CS104_Slave_getAppLayerParameters(self.slave)

        #/* set the callback handler for the clock synchronization command */
        CS104_Slave_setClockSyncHandler(self.slave, self.clockSyncHandler, None)

        #/* set the callback handler for the interrogation command */
        CS104_Slave_setInterrogationHandler(self.slave, self.interrogationHandler, None)

        #/* set handler for other message types */
        CS104_Slave_setASDUHandler(self.slave, self.asduHandler, None)

        #/* set handler to handle connection requests (optional) */
        CS104_Slave_setConnectionRequestHandler(self.slave, self.connectionRequestHandler, None)

        #/* set handler to track connection events (optional) */
        CS104_Slave_setConnectionEventHandler(self.slave, self.connectionEventHandler, None)

        CS104_Slave_setReadHandler(self.slave, self.readEventHandler, None)

        self.ioa_list = ioa_list if ioa_list is not None else {}
        
        # Store references to circuit_breakers, telesignals, and telemetries
        self.circuit_breakers = circuit_breakers
        self.telesignals = telesignals
        self.telemetries = telemetries
    
    def start(self):
        logger.info("Starting 104 server")
        CS104_Slave_start(self.slave)

        if CS104_Slave_isRunning(self.slave) == False:
            return -1
        return 0
    
    def stop(self):
        CS104_Slave_stop(self.slave)
        CS104_Slave_destroy(self.slave)
    
    def connection_request(self, param, address):
        logger.info(f"New connection request from {address}")
        return True

    def connection_event(self, param, connection, event):
        logger.info(f"Connection event {event} for {connection}")
        if (event == CS104_CON_EVENT_CONNECTION_OPENED):
            logger.info(f"Connection opened {connection}")
        elif (event == CS104_CON_EVENT_CONNECTION_CLOSED):
            logger.info(f"Connection closed {connection}")
        elif (event == CS104_CON_EVENT_ACTIVATED):
            logger.info(f"Connection activated {connection}")
        elif (event == CS104_CON_EVENT_DEACTIVATED):
            logger.info(f"Connection deactivated {connection}")
        
    def printCP56Time2a(self, time):
        logger.info("%02i:%02i:%02i %02i/%02i/%04i" % ( CP56Time2a_getHour(time),
                        CP56Time2a_getMinute(time),
                        CP56Time2a_getSecond(time),
                        CP56Time2a_getDayOfMonth(time),
                        CP56Time2a_getMonth(time),
                        CP56Time2a_getYear(time) + 2000) )

    def clock(self, param, con, asdu, newTime):
        logger.info("Process time sync command with time")
        self.printCP56Time2a(newTime)
        newSystemTimeInMs = CP56Time2a_toMsTimestamp(newTime)
        #/* Set time for ACT_CON message */
        CP56Time2a_setFromMsTimestamp(newTime, Hal_getTimeInMs())
        #/* update system time here */
        return True

    def GI_h(self, param, connection, asdu, qoi):
        logger.info(f"Received interrogation for group {qoi}")

        if (qoi == 20): #{ /* only handle station interrogation */
            try:
                alParams = IMasterConnection_getApplicationLayerParameters(connection)
                IMasterConnection_sendACT_CON(connection, asdu, False)

                #* The CS101 specification only allows information objects without timestamp in GI responses */
                # measuredvalue
                type = MeasuredValueScaled
                newAsdu = CS101_ASDU_create(alParams, False, CS101_COT_INTERROGATED_BY_STATION, 0, 1, False, False)
                io = None
                for ioa in self.ioa_list:
                    if self.ioa_list[ioa]['type'] == type:
                        if io == None:
                            io = cast( MeasuredValueScaled_create(None,ioa, self.ioa_list[ioa]['data'], IEC60870_QUALITY_GOOD), InformationObject) #
                            CS101_ASDU_addInformationObject(newAsdu, io)
                        else:
                            CS101_ASDU_addInformationObject(newAsdu, cast( MeasuredValueScaled_create(cast(io,MeasuredValueScaled),ioa,self.ioa_list[ioa]['data'],IEC60870_QUALITY_GOOD), InformationObject) )
                if io != None:
                    InformationObject_destroy(io)
                    IMasterConnection_sendASDU(connection, newAsdu)
                CS101_ASDU_destroy(newAsdu)
            except Exception as E:
                logger.info(f"Error {E}")
                
            try:
                #singlepoint
                type = SinglePointInformation
                newAsdu = CS101_ASDU_create(alParams, False, CS101_COT_INTERROGATED_BY_STATION, 0, 1, False, False)
                io = None
                for ioa in self.ioa_list:
                    if self.ioa_list[ioa]['type'] == type:
                        if io == None:
                            io = cast( SinglePointInformation_create(None, ioa, self.ioa_list[ioa]['data'], IEC60870_QUALITY_GOOD), InformationObject)
                            CS101_ASDU_addInformationObject(newAsdu, io)
                        else:
                            CS101_ASDU_addInformationObject(newAsdu, cast( SinglePointInformation_create(cast(io,SinglePointInformation), ioa,self.ioa_list[ioa]['data'],IEC60870_QUALITY_GOOD), InformationObject) )
                if io != None:
                    InformationObject_destroy(io)
                    IMasterConnection_sendASDU(connection, newAsdu)
                CS101_ASDU_destroy(newAsdu)
            except Exception as E:
                logger.info(f"Error {E}")
                
            try:
                type = DoublePointInformation
                newAsdu = CS101_ASDU_create(alParams, False, CS101_COT_INTERROGATED_BY_STATION, 0, 1, False, False)
                io = None
                for ioa in self.ioa_list:
                    if self.ioa_list[ioa]['type'] == type:
                        if io == None:
                            io = cast( DoublePointInformation_create(None, ioa, self.ioa_list[ioa]['data'], IEC60870_QUALITY_GOOD), InformationObject)
                            CS101_ASDU_addInformationObject(newAsdu, io)
                        else:
                            CS101_ASDU_addInformationObject(newAsdu, cast( DoublePointInformation_create(cast(io,DoublePointInformation), ioa,self.ioa_list[ioa]['data'],IEC60870_QUALITY_GOOD), InformationObject) )
                if io != None:
                    InformationObject_destroy(io)
                    IMasterConnection_sendASDU(connection, newAsdu)
                CS101_ASDU_destroy(newAsdu)
            except Exception as E:
                logger.info(f"Error {E}")
                
            try:
                type = MeasuredValueNormalized
                newAsdu = CS101_ASDU_create(alParams, False, CS101_COT_INTERROGATED_BY_STATION, 0, 1, False, False)
                io = None
                for ioa in self.ioa_list:
                    if self.ioa_list[ioa]['type'] == type:
                        if io == None:
                            io = cast( MeasuredValueNormalized_create(None, ioa, self.ioa_list[ioa]['data'], IEC60870_QUALITY_GOOD), InformationObject)
                            CS101_ASDU_addInformationObject(newAsdu, io)
                        else:
                            CS101_ASDU_addInformationObject(newAsdu, cast( MeasuredValueNormalized_create(cast(io,MeasuredValueNormalized), ioa,self.ioa_list[ioa]['data'],IEC60870_QUALITY_GOOD), InformationObject) )
                if io != None:
                    InformationObject_destroy(io)
                    IMasterConnection_sendASDU(connection, newAsdu)
                CS101_ASDU_destroy(newAsdu)
            except Exception as E:
                logger.info(f"Error {E}")
                
            try:
                type = MeasuredValueShort
                newAsdu = CS101_ASDU_create(alParams, False, CS101_COT_INTERROGATED_BY_STATION, 0, 1, False, False)
                io = None
                for ioa in self.ioa_list:
                    if self.ioa_list[ioa]['type'] == type:
                        if io == None:
                            io = cast( MeasuredValueShort_create(None, ioa, self.ioa_list[ioa]['data'], IEC60870_QUALITY_GOOD), InformationObject)
                            CS101_ASDU_addInformationObject(newAsdu, io)
                        else:
                            CS101_ASDU_addInformationObject(newAsdu, cast( MeasuredValueShort_create(cast(io,MeasuredValueShort), ioa,self.ioa_list[ioa]['data'],IEC60870_QUALITY_GOOD), InformationObject) )
                if io != None:
                    InformationObject_destroy(io)
                    IMasterConnection_sendASDU(connection, newAsdu)
                CS101_ASDU_destroy(newAsdu)
            except Exception as E:
                logger.info(f"Error {E}")
                
            try:
                
                #MeasuredValueShortWithCP56Time2a
                type = MeasuredValueShortWithCP56Time2a
                newAsdu = CS101_ASDU_create(alParams, False, CS101_COT_INTERROGATED_BY_STATION, 0, 1, False, False)
                
                # Dapatkan waktu saat ini
                now = datetime.datetime.now()
                
                # # Buat objek timestamp dengan waktu saat ini
                # timestamp = struct_sCP56Time2a()
                
                io = None
                timestamp = struct_sCP56Time2a()
                # Isi bidang encodedValue dengan nilai yang sesuai dari waktu saat ini
                timestamp.encodedValue = (
                    now.microsecond // 1000,    # Detik
                    now.second,    # Menit
                    now.minute,      # Jam
                    now.hour + 7,       # Hari dalam bulan
                    now.day,     # Bulan
                    now.month,
                    now.year % 1000# Tahun (hanya dua digit terakhir)
                )

                logger.info("Year: %d, Month: %d, Day: %d, Hour: %d, Minute: %d, Second: %d, MS: %d", now.year, now.month, now.day, now.hour, now.minute, now.second, now.microsecond)
                # timestamp.encodedValue = (1, 2, 3, 4, 5, 6, 7)
                
                for ioa in self.ioa_list:
                    if self.ioa_list[ioa]['type'] == type:
                        if io == None:
                            io = cast( MeasuredValueShortWithCP56Time2a_create(None, ioa, self.ioa_list[ioa]['data'], IEC60870_QUALITY_GOOD, timestamp), InformationObject)
                            CS101_ASDU_addInformationObject(newAsdu, io)
                        else:
                            CS101_ASDU_addInformationObject(newAsdu, cast( MeasuredValueShortWithCP56Time2a_create(cast(io,MeasuredValueShortWithCP56Time2a), ioa, self.ioa_list[ioa]['data'],IEC60870_QUALITY_GOOD, timestamp), InformationObject) )
                if io != None:
                    InformationObject_destroy(io)
                    IMasterConnection_sendASDU(connection, newAsdu)
                CS101_ASDU_destroy(newAsdu)

                IMasterConnection_sendACT_TERM(connection, asdu)
            except Exception as E:
                logger.info(f"Error {E}")
        else:
            IMasterConnection_sendACT_CON(connection, asdu, True)

    def ASDU_h(self, param, connection, asdu):
        logger.info("ASDU received")
        cot = CS101_ASDU_getCOT(asdu)
        if cot == CS101_COT_ACTIVATION:
            io = CS101_ASDU_getElement(asdu, 0)
            ioa = InformationObject_getObjectAddress(io)
            if not ioa in self.ioa_list:
                logger.info("could not find IOA")
                CS101_ASDU_setCOT(asdu, CS101_COT_UNKNOWN_IOA)
            else:
                ioa_object = self.ioa_list[ioa]
                if (CS101_ASDU_getTypeID(asdu) == C_SC_NA_1):
                    logger.info("Received single command")
                    if ioa_object['type'] == SingleCommand:
                        sc = cast( io, SingleCommand)
                        
                        logger.info(f"IOA: {InformationObject_getObjectAddress(io)} switch to {SingleCommand_getState(sc)}, select:{SingleCommand_isSelect(sc)}")
                        ioa_object['data'] = SingleCommand_getState(sc)
                        if self.ioa_list[ioa]['callback'] != None:
                            self.ioa_list[ioa]['callback'](ioa,ioa_object, self, SingleCommand_isSelect(sc))

                        CS101_ASDU_setCOT(asdu, CS101_COT_ACTIVATION_CON)
                    else:
                        logger.info("Mismatching asdu type:")
                        CS101_ASDU_setCOT(asdu, CS101_COT_UNKNOWN_TYPE_ID)

                if (CS101_ASDU_getTypeID(asdu) == C_DC_NA_1):
                    logger.info("Received double command")
                    if ioa_object['type'] == DoubleCommand:
                        sc = cast( io, DoubleCommand)
                        logger.info(f"IOA: {InformationObject_getObjectAddress(io)} switch to {DoubleCommand_getState(sc)}, select:{DoubleCommand_isSelect(sc)}")
                        ioa_object['data'] = DoubleCommand_getState(sc)
                        if self.ioa_list[ioa]['callback'] != None:
                            self.ioa_list[ioa]['callback'](ioa,ioa_object, self, DoubleCommand_isSelect(sc))

                        CS101_ASDU_setCOT(asdu, CS101_COT_ACTIVATION_CON)
                    else:
                        logger.info("Mismatching asdu type:")
                        CS101_ASDU_setCOT(asdu, CS101_COT_UNKNOWN_TYPE_ID)

            InformationObject_destroy(io)
        elif cot == CS101_COT_ACTIVATION_TERMINATION:
            logger.info("GI done")
        else:
            logger.info("ASDU unknown: " + str(CS101_ASDU_getCOT(asdu)))
            CS101_ASDU_setCOT(asdu, CS101_COT_UNKNOWN_COT)

        IMasterConnection_sendASDU(connection, asdu)

        return True
    
    # IOAs Handlers
    def read(self, param, connection, asdu, ioa):
        if ioa in self.ioa_list:
            # update data
            if self.ioa_list[ioa]['callback'] != None:
                self.ioa_list[ioa]['callback'](ioa,self.ioa_list[ioa], self)

            newAsdu = CS101_ASDU_create(self.alParams, False, CS101_COT_SPONTANEOUS, 0, 1, False, False)
            if self.ioa_list[ioa]['type'] == MeasuredValueScaled:
                io = cast(MeasuredValueScaled_create(None, ioa, self.ioa_list[ioa]['data'], IEC60870_QUALITY_GOOD),InformationObject)
            elif self.ioa_list[ioa]['type'] == SinglePointInformation:
                io = cast(SinglePointInformation_create(None, ioa, self.ioa_list[ioa]['data'], IEC60870_QUALITY_GOOD),InformationObject)
            elif self.ioa_list[ioa]['type'] == DoublePointInformation:
                io = cast(DoublePointInformation_create(None, ioa, self.ioa_list[ioa]['data'], IEC60870_QUALITY_GOOD),InformationObject)
            else:
                return False
            CS101_ASDU_addInformationObject(newAsdu, io)
            InformationObject_destroy(io)
            #/* Add ASDU to slave event queue - don't release the ASDU afterwards!
            CS104_Slave_enqueueASDU(self.slave, newAsdu)
            CS101_ASDU_destroy(newAsdu)  
            return True
        return False

    def add_ioa(self, number, type = MeasuredValueScaled, data = 0, callback = None, event = False):
        logger.info(f"Adding IOA {number} with type {type} and data {data}")
        if not number in self.ioa_list:
            self.ioa_list[int(number)] = { 'type': type, 'data': data, 'callback': callback, 'event': event }
            return 0
        else:
            return -1

    def update_ioa(self, ioa, data):
        value = int(float(data))
        if ioa in self.ioa_list and value != self.ioa_list[ioa]['data']: #check if value is different, else ignore
            self.ioa_list[ioa]['data'] = value
            if self.ioa_list[ioa]['event'] == True:
                newAsdu = CS101_ASDU_create(self.alParams, False, CS101_COT_SPONTANEOUS, 0, 1, False, False)
                if self.ioa_list[ioa]['type'] == MeasuredValueScaled:
                    self.ioa_list[ioa]['data'] = int(float(data))
                    io = cast(MeasuredValueScaled_create(None, ioa, self.ioa_list[ioa]['data'], IEC60870_QUALITY_GOOD),InformationObject)
                elif self.ioa_list[ioa]['type'] == SinglePointInformation:
                    self.ioa_list[ioa]['data'] = int(float(data))
                    io = cast(SinglePointInformation_create(None, ioa, self.ioa_list[ioa]['data'], IEC60870_QUALITY_GOOD),InformationObject)
                elif self.ioa_list[ioa]['type'] == DoublePointInformation:
                    self.ioa_list[ioa]['data'] = int(float(data))
                    io = cast(DoublePointInformation_create(None, ioa, self.ioa_list[ioa]['data'], IEC60870_QUALITY_GOOD),InformationObject)
                elif self.ioa_list[ioa]['type'] == MeasuredValueShort:
                    self.ioa_list[ioa]['data'] = float(data)
                else:
                    return -1

                CS101_ASDU_addInformationObject(newAsdu, io)
                InformationObject_destroy(io)
                #/* Add ASDU to slave event queue - don't release the ASDU afterwards!
                CS104_Slave_enqueueASDU(self.slave, newAsdu)
                CS101_ASDU_destroy(newAsdu)
                
# Emit the updated IOA data
            if hasattr(self, 'socketio') and self.socketio:
                if self.circuit_breakers and ioa in [cb.ioa_cb_status for cb in self.circuit_breakers.values()]:
                    logger.info(f"Updated circuit breaker {ioa} to {self.circuit_breakers[ioa].data}, triggered in update_ioa function")
                    self.socketio.emit('circuit_breakers', [item.model_dump() for item in self.circuit_breakers.values()])
                elif self.telesignals and ioa in [ts.ioa for ts in self.telesignals.values()]:
                    logger.info(f"Updated telesignal {ioa} to {self.telesignals[ioa].data}, triggered in update_ioa function")
                    self.socketio.emit('telesignals', [item.model_dump() for item in self.telesignals.values()])
                elif self.telemetries and ioa in [tm.ioa for tm in self.telemetries.values()]:
                    logger.info(f"Updated telemetry {ioa} to {self.telemetries[ioa].data}, triggered in update_ioa function")
                    self.socketio.emit('telemetries', [item.model_dump() for item in self.telemetries.values()])
        return 0
    
    def remove_ioa(self, ioa):
        if int(ioa) in self.ioa_list:
            del self.ioa_list[int(ioa)]
            return 0
        else:
            return -1