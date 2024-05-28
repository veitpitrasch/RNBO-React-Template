import React from "react";

function VolumeControl({ volume, onChange }) {
    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        onChange(newVolume);
    };

    return (
        <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
        />
    );
}

export default VolumeControl;