import React, { useState, useEffect } from "react";
import { createDevice, TimeNow, MessageEvent } from "@rnbo/js";
import Slider from "./Slider";
import './RNBOPatch.css';

function App() {
    const [context, setContext] = useState(null);
    const [device, setDevice] = useState(null);
    const [isContextStarted, setIsContextStarted] = useState(false);
    const [isAudioLoaded, setIsAudioLoaded] = useState(false);

    const [gainValue, setGainValue] = useState(0); // Initialisiert den Wert der Lautstärke in Millisekunden
    const [delayValue, setDelayValue] = useState(0); // Initialisiert den Wert des Delays in Millisekunden
    const [isLooping, setIsLooping] = useState(false); // Initialisiert den Zustand des Loops
    const [loopStartValue, setLoopStartValue] = useState(0); // Initialisiert den Startpunkt des des Loops in Millisekunden
    const [loopEndValue, setLoopEndValue] = useState(0); // Initialisiert den Endpunkt des des Loops in Millisekunden

    /* Uninterssanter Teil */

    useEffect(() => {
        const initializeAudioContext = async () => {
            let audioContext = new (window.AudioContext || window.webkitAudioContext)();
            setContext(audioContext);

            let rawPatcher = await fetch("/export/file_integration.export.json");
            let patcher = await rawPatcher.json();

            let newDevice = await createDevice({ context: audioContext, patcher });
            setDevice(newDevice);

            newDevice.node.connect(audioContext.destination);

            console.log('***** Alle Parameter *****');
            newDevice.parameters.forEach(parameter => {
                console.log(`ID: ${parameter.id} | Name: ${parameter.name} | Wert: ${parameter.value} | Wertebereich: ${parameter.min} - ${parameter.max}`);
                if (parameter.id === "gain") {
                    setGainValue(parameter.value);
                } else if (parameter.id === "delaytime") {
                    setDelayValue(parameter.value);
                }
            });
            console.log('**************************');

            newDevice.messageEvent.subscribe((ev) => {
                console.log(`Received message from ${ev.tag}: ${ev.payload}`);
            });

            navigator.mediaDevices.getUserMedia({ audio: true, video: false })
                .then((stream) => handleSuccess(stream, audioContext, newDevice));
        };

        const handleSuccess = (stream, audioContext, newDevice) => {
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(newDevice.node);
        };

        initializeAudioContext();
    }, []);

    const startAudioContext = () => {
        if (context) {
            if (!isContextStarted) {
                context.resume().then(() => {
                    console.log('AudioContext gestartet');
                    setIsContextStarted(true);
                });
            } else {
                context.suspend().then(() => {
                    console.log('AudioContext unterbrochen');
                    setIsContextStarted(false);
                });
            }
        }
    };

    /* Uninterssanter Teil zu Ende */

    const handleSliderChange = (parameterId, newValue) => {
        if (parameterId === "gain") {
            setGainValue(newValue);
        } else if (parameterId === "delaytime") {
            setDelayValue(newValue);
        } else if (parameterId === "loop_start") {
            setLoopStartValue(newValue);
        } else if (parameterId === "loop_end") {
            setLoopEndValue(newValue);
        }
        if (device) {
            const param = device.parametersById.get(parameterId);
            param.value = newValue;
        }
    };

    /* Funktion, die eine Nachricht an den Inport mit dem Tag "start" sendet -> Startet Audiofile mit einem Bang*/
    const sendToInput = () => {
        if (device) {
            const event = new MessageEvent(TimeNow, "start", [1]);
            device.scheduleEvent(event);
        } else {
            console.error('Gerät ist nicht initialisiert.');
        }
    };

    /* Funktion, die eine Nachricht an den Inport mit dem Tag "loop" sendet -> Setzt Loop-Toggle */
    const toggleLoop = () => {
        if (device) {
            const loopState = isLooping ? 0 : 1;
            const event = new MessageEvent(TimeNow, "loop", [loopState]);
            device.scheduleEvent(event);
            setIsLooping(!isLooping);
        } else {
            console.error('Gerät ist nicht initialisierbar.');
        }
    };

    /* Funktion, die das Audiofile in den Buffer (wird benötigt, um Audio Dateien im Browser abspielen zu können)*/
    const loadAudioFile = async () => {
        if (!device) {
            console.error('Gerät ist nicht initialisiert.');
            return;
        }

        const bufferId = "drummer";  // ID des Sample-Buffers in RNBO

        try {
            const fileResponse = await fetch("/export/media/drums_sample.mp3"); // Pfad zur Audio-Datei
            const arrayBuf = await fileResponse.arrayBuffer();

            const audioBuf = await context.decodeAudioData(arrayBuf);

            await device.setDataBuffer(bufferId, audioBuf);

            setIsAudioLoaded(true);

            console.log(`Audiodatei erfolgreich in Buffer mit id ${bufferId} geladen`);
        } catch (error) {
            console.error(`Fehler beim Laden der Audiodatei: ${error}`);
        }
    };

    return (
        <div id="rnbopatch">
            <h1><span>R</span><span>N</span><span>B</span><span>O</span> Patch</h1>
            <button id="button" onClick={startAudioContext}>{isContextStarted ? 'Audiokontext stoppen' : 'Audiokontext starten'}</button>
            <div className="delayContainer">
                <Slider headline="Lautstärke" parameterId="gain" minValue={0} maxValue={1} step={0.01} value={gainValue} onChange={handleSliderChange}/>
                <Slider headline="Verzögerung" parameterId="delaytime" minValue={0} maxValue={2000} step={10} value={delayValue} onChange={handleSliderChange}/>
            </div>
            <div className="audiofileContainer">
                {isContextStarted && isAudioLoaded && (
                    <button id="sendButton" onClick={sendToInput}>Audiodatei starten</button>
                )}
                {isContextStarted && !isAudioLoaded && (
                    <button id="loadAudioButton" onClick={loadAudioFile}>Audiodatei laden</button>
                )}
                <Slider headline="Loop-Start" parameterId="loop_start" minValue={0} maxValue={5000} step={0.1} value={loopStartValue} onChange={handleSliderChange}/>
                <Slider headline="Loop-Ende" parameterId="loop_end" minValue={0} maxValue={5000} step={0.1} value={loopEndValue} onChange={handleSliderChange}/>
                {isContextStarted && isAudioLoaded && (
                    <button id="setLoop" onClick={toggleLoop}>{isLooping ? 'Loop stoppen' : 'Loop starten'}</button>
                )}
            </div>
        </div>
    );
}

export default App;
