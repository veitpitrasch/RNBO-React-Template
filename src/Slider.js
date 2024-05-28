import React from 'react';
import './Slider.css';

const Slider = ({ headline, parameterId, minValue, maxValue, step, value, onChange }) => {
    return (
        <div className="sliderContainer">
            <h2>{headline}</h2>
                <input
                    type="range"
                    min={minValue}
                    max={maxValue}
                    step={step}
                    value={value} // Den aktuellen Wert des Parameters verwenden
                    onChange={(event) => onChange(parameterId, parseFloat(event.target.value))}
                />
        </div>
    );
};

export default Slider;
