import { useCallback, useEffect, useState } from 'react';
import './styles/styles.css';

import RandomText from './random-text.jsx';
import CursorVoid from './cursor-void.jsx';
import Particles from './particles.jsx';

export default function Main() {
    //Color
        const initialColor = 'rgb(238, 238, 238)';
        const finalColor = 'rgb(38, 38, 38)';

        const [voidColor, setVoidColor] = useState({
            color: initialColor,
            progress: 0
        });

        const interpolateColor = useCallback((c1, c2, f) => {
            if(f <= 0) return c1;
            if(f >= 1) return c2;

            const fColor = c1.match(/\d+/g).map(Number);
            const sColor = c2.match(/\d+/g).map(Number);

            //Color
            const r = Math.round(fColor[0] + (sColor[0] - fColor[0]) * f);
            const g = Math.round(fColor[1] + (sColor[1] - fColor[1]) * f);
            const b = Math.round(fColor[2] + (sColor[2] - fColor[2]) * f);

            return `rgb(${r}, ${g}, ${b})`;
        }, []);

        useEffect(() => {
            const handleVoidStatusUpdate = (e) => {
                if(!e.detail) return;

                requestAnimationFrame(() => {
                    setVoidColor({
                        color: interpolateColor(initialColor, finalColor, e.detail.progress),
                        progress: e.detail.progress
                    });
                });
            }

            window.addEventListener('voidStatusUpdate', handleVoidStatusUpdate);
            return () => window.removeEventListener('voidStatusUpdate', handleVoidStatusUpdate);
        }, [interpolateColor]);

        const setBgColor = useCallback(() => {
            return voidColor?.color || initialColor;
        }, [voidColor.color]);
    //

    return (
        <>
            <div className='container' 
                style={{ 
                    backgroundColor: setBgColor(),
                    transition: 'background-color 0.3s ease' 
                }}>

                
                <CursorVoid />
                <Particles />
            </div>
        </>
    )
}