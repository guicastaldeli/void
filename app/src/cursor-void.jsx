import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import debounce from 'lodash.debounce';
import './styles/cursor-void/cursor-void.scss'

export default function CursorVoid() {
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [radius, setRadius] = useState(20);
    const [deletedChars, setDeletedChars] = useState(0);
    const [isActive, setIsActive] = useState(true);
    const voidRef = useRef(null);

    const currentRadius = radius + Math.min(deletedChars * 0.5, 200);

    //Color
        const initialColor = [50, 168, 82];
        const finalColor = [153, 45, 161];
        const [colorProgress, setColorProgress] = useState(0);

        const getVoidColor = useMemo(() => {
            if(colorProgress <= 0) return `rgb(${initialColor.join(', ')})`;
            if(colorProgress >= 1) return `rgb(${finalColor.join(', ')})`;

            //Interpolate
            const r = Math.round(initialColor[0] + (finalColor[0] - initialColor[0]) * colorProgress);
            const g = Math.round(initialColor[1] + (finalColor[1] - initialColor[1]) * colorProgress);
            const b = Math.round(initialColor[2] + (finalColor[2] - initialColor[2]) * colorProgress);

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

    const debouncedDispatch = useMemo(() => debounce((e) => {
        if(voidRef.current) {
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
        }
    }, 32), [isActive]);

    const handleMouseMove = useCallback((e) => {
        setPos({ x: e.clientX, y: e.clientY });
        debouncedDispatch();
    }, [debouncedDispatch]);

    useEffect(() => {
        debouncedDispatch();
    }, [currentRadius, debouncedDispatch]);

    //Listeners
    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            debouncedDispatch.cancel();
        }
    }, [handleMouseMove, debouncedDispatch]);

    return (
        <>
            <div 
                className='void'
                ref={voidRef}
                style={{
                    position: 'fixed',
                    left: `${pos.x - currentRadius}px`,
                    top: `${pos.y - currentRadius}px`,
                    width: `${currentRadius * 2}px`,
                    height: `${currentRadius * 2}px`,
                    pointerEvents: 'none',
                    borderRadius: '50%',
                    backgroundColor: getVoidColor,
                    transition: 'background-color 0.3s ease'
                }}
            >
            </div>
        </>
    )
}