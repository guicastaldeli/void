import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import './styles/cursor-void/cursor-void.scss'

export default function CursorVoid() {
    const posRef = useRef({ x: 0, y: 0 });
    const [radius, setRadius] = useState(20);
    const [deletedChars, setDeletedChars] = useState(0);
    const [isActive, setIsActive] = useState(true);
    const voidRef = useRef(null);
    const animationRef = useRef(null);

    const currentRadius = radius + Math.min(deletedChars * 0.5, 200);

    //Color
        const initialColor = 'rgb(0, 0, 0)';
        const finalColor = 'rgb(255, 255, 255)';
        const [colorProgress, setColorProgress] = useState(0);

        const getVoidColor = useMemo(() => {
            if(colorProgress <= 0) return initialColor;
            if(colorProgress >= 1) return finalColor;

            const fColor = initialColor.match(/\d+/g).map(Number);
            const sColor = finalColor.match(/\d+/g).map(Number);

            //Interpolate
            const r = Math.round(fColor[0] + (sColor[0] - fColor[0]) * colorProgress);
            const g = Math.round(fColor[1] + (sColor[1] - fColor[1]) * colorProgress);
            const b = Math.round(fColor[2] + (sColor[2] - fColor[2]) * colorProgress);

            return `rgb(${r}, ${g}, ${b})`;
        }, [deletedChars]);

        useEffect(() => {
            const progress = Math.min(deletedChars / 400, 1);
            setColorProgress(progress);
        }, [deletedChars]);

        useEffect(() => {
            if(getVoidColor && colorProgress !== undefined) {
                requestAnimationFrame(() => {
                    window.dispatchEvent(new CustomEvent('voidStatusUpdate', {
                        detail: {
                            color: getVoidColor,
                            progress: colorProgress
                        }
                    }));
                });
            }
        }, [getVoidColor, colorProgress]);
    //

    const updateCursor = useCallback(() => {
        if(!voidRef.current) return;

        voidRef.current.style.left = `${posRef.current.x - currentRadius}px`;
        voidRef.current.style.top = `${posRef.current.y - currentRadius}px`;

        const rect = voidRef.current.getBoundingClientRect();
            
        window.dispatchEvent(new CustomEvent('cursorUpdate', {
            detail: {
                left: rect.left,
                right: rect.right,
                top: rect.top,
                bottom: rect.bottom,
                isActive: isActive,
                onDeleted: () => setDeletedChars(c => c + 1)
            }
        }));

        animationRef.current = requestAnimationFrame(updateCursor);
    }, [isActive, currentRadius]);

    const handleMouseMove = useCallback((e) => {
        posRef.current = { x: e.clientX, y: e.clientY };
    }, []);

    useEffect(() => {
        if(voidRef.current) {
            voidRef.current.style.left = `${posRef.current.x - currentRadius}px`;
            voidRef.current.style.top = `${posRef.current.y - currentRadius}px`;
        }

        animationRef.current = requestAnimationFrame(updateCursor);
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            cancelAnimationFrame(animationRef.current);
            window.removeEventListener('mousemove', handleMouseMove);
        }
    }, [updateCursor, handleMouseMove]);

    return (
        <>
            <div 
                className='void'
                ref={voidRef}
                style={{
                    position: 'fixed',
                    width: `${currentRadius * 2}px`,
                    height: `${currentRadius * 2}px`,
                    pointerEvents: 'none',
                    borderRadius: '50%',
                    backgroundColor: getVoidColor,
                    transition: 'background-color 0.3s ease',
                    willChange: 'left, top'
                }}
            >
            </div>
        </>
    )
}