import * as React from 'react';
import {
    useInput,
    Button,
    useNotify
} from 'react-admin';
import {Box} from '@mui/material';
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid"; // a plugin!
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import moment from "moment";
import Dialog from '@mui/material/Dialog';
import MUITextField from '@mui/material/TextField';
import {nanoid} from 'nanoid'

const MIN_TIME = 7;
const MAX_TIME = 16;

// Using this date because at 1 it starts from sunday
// FullCalendar doesn't have only week data to work with, it has these dates to
// so a workaround will be wrapper around this

const getInitialDate = (weekDay) => `2023-01-0${weekDay + 1}`
const daysOfWeek = ["sun", "mon", "tue", "wed", "thu", "fri"];

const weekDayToNumber = (day) => {
    const index = daysOfWeek.indexOf(day);
    return index;
}

const numberToWeekDay = (number) => {
    return daysOfWeek[number];
}


const parseToDailySchedules = (subjectSchedules) => {
    let dailySchedules = {
        "sun": [],
        "mon": [],
        "tue": [],
        "wed": [],
        "thu": [],
        "fri": [],
    };

    for (let i = 0; i < subjectSchedules.length; i++) {
        let startTime = new Date(subjectSchedules[i].start);
        let endTime = new Date(subjectSchedules[i].end);
        let day = startTime.getDay();
        let subject = subjectSchedules[i].title;

        dailySchedules[numberToWeekDay(day)].push({
            "startTime": startTime.getHours(),
            "endTime": endTime.getHours(),
            subject
        })
    }
    return dailySchedules;
}

let randomID = () => nanoid();

// TODO: Add null validation on saving / updating
// TODO : Add a validation on the min time and max time coz if i were to drag a 2hr item below the bottom of 
// the calendar then it's gonna show some issue  of overflowing more than constrained time
const Schedule = ({source}) => {
    const {field} = useInput({source});
    let notify = useNotify();

    const new_dialog_state = {
        isOpen: false,
        id: null,
        startTime: null,
        endTime: null,
        day: null,
        subject: null,
    };

    let [schedules, updateSchedules] = React.useState([]);
    let [dialogState, updateDialogState] = React.useState(new_dialog_state);


    const saveSchedule = () => {
        let newSchedules = [...schedules];
        let title = dialogState.title;

        if (dialogState.id === null) {
            newSchedules.push(
                {
                    "id": randomID(),
                    "title": title,
                    "start": `${getInitialDate(dialogState.day)}T${String(dialogState.startTime.getHours()).padStart(2, '0')}:00:00`,
                    "end": `${getInitialDate(dialogState.day)}T${String(dialogState.endTime.getHours()).padStart(2, '0')}:00:00`,
                }
            );
        } else {
            let index = schedules.findIndex((v => v["id"] === dialogState["id"]));
            newSchedules[index] = {
                "id": dialogState["id"],
                "title": title,
                "start": `${getInitialDate(dialogState.day)}T${String(dialogState.startTime.getHours()).padStart(2, '0')}:00:00`,
                "end": `${getInitialDate(dialogState.day)}T${String(dialogState.endTime.getHours()).padStart(2, '0')}:00:00`,
            }
        }

        field.onChange(parseToDailySchedules(newSchedules));
        updateSchedules(newSchedules);
        updateDialogState(new_dialog_state);

    }
    React.useEffect(() => {
        // checks if schedules has been already updated from the
        // coz it should be done only once
        if (schedules.length === 0) {
            let field_value = field.value;
            console.log("THE FIELD VALUE I GOT IS");
            console.log(field_value);
            let field_value_to_schedules = [];
            if (field_value != "") {
                delete field_value.__typename;
                for (const key in field_value) {
                    let day_schedules = field_value[key];
                    field_value_to_schedules = [
                        ...field_value_to_schedules,
                        ...day_schedules.map((d) => {
                            return {
                                "id": randomID(),
                                "title": d.subject,
                                "start": `${getInitialDate(weekDayToNumber(key))}T${String(d.startTime).padStart(2, '0')}:00:00`,
                                "end": `${getInitialDate(weekDayToNumber(key))}T${String(d.endTime).padStart(2, '0')}:00:00`,
                            };
                        })
                    ]
                }
            }
            updateSchedules(field_value_to_schedules);
        }
    }, [field.value])

    const onScheduleClick = (info) => {
        updateDialogState({
            isOpen: true,
            id: info.event.id,
            startTime: info.event.start,
            endTime: info.event.end,
            day: info.event.start.getDay(),
            title: info.event.title
        });
    }

    const onScheduleResize = (doneResize) => {
        let {id, start, end, title} = doneResize.event;
        let day = start.getDay();

        updateDialogState({
            isOpen: false,
            id,
            startTime: start,
            endTime: end,
            day,
            title
        });
    }

    const onScheduleDrop = (doneDrop) => {
        let {id, start, end, title, } = doneDrop.event;
        let day = start.getDay();
        let startTime = start.getHours();
        let endTime = end.getHours();

        if (startTime >= MIN_TIME && startTime <= MAX_TIME - 1 && endTime >= MIN_TIME + 1 && endTime <= MAX_TIME) {
            updateDialogState({
                isOpen: false,
                id,
                startTime: start,
                endTime: end,
                day,
                title
            });
        } else {
            notify("The schedule  you dropped is out of bounds", {type: "error"});
            doneDrop.revert();
            updateDialogState(new_dialog_state);

        }

    }
    const onSaveButtonClick = () => {
        let startTime = dialogState.startTime.getHours();
        let endTime = dialogState.endTime.getHours();

        if (startTime >= MIN_TIME && startTime <= MAX_TIME - 1 && endTime >= MIN_TIME + 1 && endTime <= MAX_TIME) {
            updateDialogState({
                ...dialogState,
                isOpen: false,
            });
        } else if (startTime === endTime) {
            notify("Start and End time can't be same ", {type: "error"});
        } else {
            notify("The time you gave is out of bounds", {type: "error"});
            updateDialogState(new_dialog_state);
        }

    }

    const onDeleteButtonClick = () => {
        let newSchedules = schedules.filter(obj => obj["id"] !== dialogState.id);
        updateSchedules(newSchedules);
        field.onChange(newSchedules.length === 0 ? null : parseToDailySchedules(newSchedules));
        updateDialogState(new_dialog_state)
    }

    React.useEffect(() => {
        // btw keeping dialogState.day only in this condition will cause false when the day is "sun" coz it will be 0 
        // so better put it dialogState.day !== null
        const dialogStateValid = () => (!dialogState.isOpen && dialogState.startTime && dialogState.endTime && dialogState.title && dialogState.day !== null);

        if (dialogStateValid()) {
            saveSchedule();
        }
    }, [dialogState]);

    return (
        <Box style={{width: "100%"}}>
            <FullCalendar
                height={700}
                nowIndicator={false}
                headerToolbar={false}
                firstDay={0}
                dayHeaderContent={(node) => {
                    const day = moment(node.date).format("dddd");
                    return day;
                }}
                eventClick={onScheduleClick}
                eventOverlap={false}
                allDaySlot={false}
                events={schedules}
                minTime
                slotMinTime={`${MIN_TIME}:00:00`}
                slotMaxTime={`${MAX_TIME}:00:00`}
                slotDuration="1:00:00"
                selectable
                editable
                selectOverlap={false}
                select={(info) => {
                    updateDialogState({
                        ...dialogState,
                        isOpen: true,
                        startTime: info.start,
                        endTime: info.end,
                        day: info.start.getDay()
                    });
                }}
                eventDrop={onScheduleDrop}
                eventResize={onScheduleResize}
                droppable
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                initialDate={getInitialDate(0)}
                hiddenDays={[6]}

            />

            <Dialog onClose={() => updateDialogState(new_dialog_state)} open={dialogState.isOpen}>
                <Box display={'flex'} width={"500px"} height={"240px"} p={"1rem"} flexDirection={"column"} justifyContent="space-between">
                    <Box>
                        <MUITextField
                            id="outlined-basic"
                            label="Subject"
                            variant='outlined'
                            fullWidth value={dialogState.title ? dialogState.title : ""}
                            onChange={(e) => {
                                updateDialogState({
                                    ...dialogState,
                                    title: e.target.value
                                });
                            }}
                        />
                        <MUITextField id="outlined-basic"
                            label="Start Time"
                            variant="outlined"
                            type={"number"}
                            value={dialogState.startTime ? dialogState.startTime.getHours() : 0}
                            onChange={(e) => {
                                let newStartTime = dialogState.startTime;
                                let hour;
                                if (!e.target.value) {
                                    hour = 0;
                                } else if (parseInt(e.target.value) < 0) {
                                    hour = 0;
                                } else if (parseInt(e.target.value) > 23) {
                                    hour = 23;
                                } else {
                                    hour = parseInt(e.target.value);
                                }

                                newStartTime.setHours(hour);
                                updateDialogState({
                                    ...dialogState,
                                    startTime: newStartTime,
                                    day: newStartTime.getDay()
                                });
                            }}
                            fullWidth />
                        <MUITextField id="outlined-basic"
                            label="End Time"
                            variant="outlined"
                            type={"number"}
                            value={dialogState.endTime ? dialogState.endTime.getHours() : 0}
                            onChange={(e) => {
                                let newEndTime = dialogState.endTime;
                                let hour;
                                if (!e.target.value) {
                                    hour = 0;
                                } else if (parseInt(e.target.value) < 0) {
                                    hour = 0;
                                } else if (parseInt(e.target.value) > 23) {
                                    hour = 23;
                                } else {
                                    hour = parseInt(e.target.value);
                                }
                                newEndTime.setHours(hour);
                                updateDialogState({
                                    ...dialogState,
                                    endTime: newEndTime
                                });
                            }}
                            fullWidth />
                    </Box>
                    <Box display={"flex"} justifyContent="space-between" width={"100%"}>
                        <Button
                            onClick={onSaveButtonClick}
                            color='success'>
                            <div>Save</div></Button>
                        {
                            dialogState.id ? <Button
                                onClick={onDeleteButtonClick}
                                color='error'>
                                <div>Delete</div></Button> : <></>
                        }

                    </Box>
                </Box>
            </Dialog>
        </Box>
    );
}

export default Schedule;
