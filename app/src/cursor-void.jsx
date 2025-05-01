import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import './styles/cursor-void/cursor-void.scss';

export default function CursorVoid() {
    const [radius, setRadius] = useState(100);
    const [deletedChars, setDeletedChars] = useState(0);
    const [isActive, setIsActive] = useState(true);
    const posRef = useRef({ x: 0, y: 0 });
    const voidRef = useRef(null);
    const animationRef = useRef({ id: null, lastDispatch: null });

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

    
    //Particles
        const canvasRef = useRef(null);
        const ctx = useRef(null);
        const particlesRef = useRef([]);
        const particlesAnimationId = useRef(null);
        const voidArea = useRef({
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            isActive: false,
        });

        //Color
            const pInitalColor = 'rgb(74, 74, 74)';
            const pFinalColor = 'rgb(193, 193, 193)';
            
            const getParticleColor = useCallback(() => {
                if(colorProgress <= 0) return pInitalColor;
                if(colorProgress >= 1) return pFinalColor;

                const fColor = pInitalColor.match(/\d+/g).map(Number);
                const sColor = pFinalColor.match(/\d+/g).map(Number);

                const r = Math.round(fColor[0] + (sColor[0] - fColor[0]) * colorProgress);
                const g = Math.round(fColor[1] + (sColor[1] - fColor[1]) * colorProgress);
                const b = Math.round(fColor[2] + (sColor[2] - fColor[2]) * colorProgress);

                return `rgb(${r}, ${g}, ${b})`;
            }, [colorProgress]);
        //

        const setupParticles = useCallback(() => {
            const canvas = canvasRef.current;
            if(!canvas) return;

            const container = canvas.parentElement;
            const displayWidth = container.clientWidth;
            const displayHeight = container.clientHeight;

            canvas.style.width = `${displayWidth}px`;
            canvas.style.height = `${displayHeight}px`;

            const dpr = window.devicePixelRatio || 1;
            canvas.width = Math.round(displayWidth * dpr);
            canvas.height = Math.round(displayHeight * dpr);

            ctx.current = canvas.getContext('2d');
            ctx.current.scale(dpr, dpr);
        }, []);

        const initParticles = useCallback(() => {
            const particles = [];
            const particlesCount = 40;

            const voidRect = voidRef.current?.getBoundingClientRect() || {
                left: 0, 
                top: 0, 
                width: currentRadius * 2, 
                height: currentRadius * 2
            }

            const centerX = voidRect.left + voidRect.width / 2;
            const centerY = voidRect.top + voidRect.height / 2;
            const radius = currentRadius * 0.8;

            for(let i = 0; i < particlesCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * radius;

                particles.push({
                    x: centerX + Math.cos(angle) * distance,
                    y: centerY + Math.sin(angle) * distance,
                    targetDistance: distance,
                    size: Math.random() * 3 + 1,
                    speed: Math.random() * 2.5 + 0.1,
                    opacity: Math.random() * 0.5 + 0.3,
                    life: Math.random() * 100 + 50,
                    maxLife: Math.random() * 100 + 50
                });
            }

            particlesRef.current = particles;
        }, [currentRadius]);

        const animateParticles = useCallback(() => {
            if(!ctx.current) {
                particlesAnimationId.current = requestAnimationFrame(animateParticles);
                return;
            }

            ctx.current.clearRect(
                -1, -1, 
                canvasRef.current.width / window.devicePixelRatio, 
                canvasRef.current.height / window.devicePixelRatio
            );

            if(voidArea.current.isActive) {
                const voidWidth = voidArea.current.right - voidArea.current.left;
                const voidHeight = voidArea.current.bottom - voidArea.current.top;
                const voidCenterX = voidArea.current.left + voidWidth / 2;
                const voidCenterY = voidArea.current.top + voidHeight / 2;
                const currentVoidRadius = Math.min(voidWidth, voidHeight) * 0.4;
    
                for(let i = 0; i < particlesRef.current.length; i++) {
                    const p = particlesRef.current[i];
    
                    const canvasX = p.x - voidArea.current.left;
                    const canvasY = p.y - voidArea.current.top;
    
                    const dx = p.x - voidCenterX;
                    const dy = p.y - voidCenterY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const targetDistance = p.targetDistance * (currentVoidRadius / (currentVoidRadius * 0.8));
    
                    if(p.life <= 0 || distance > currentVoidRadius) {
                        const angle = Math.random() * Math.PI * 2;
                        const spawnDistance = Math.random() * Math.min(voidWidth, voidHeight) * 0.4;
    
                        p.x = voidCenterX + Math.cos(angle) * spawnDistance;
                        p.y = voidCenterY + Math.sin(angle) * spawnDistance;
                        p.life = p.maxLife;
                        p.opacity = Math.random() * 0.5 + 0.3;
                        p.targetDistance = spawnDistance;
                    } else {    
                        p.x += (Math.random() - 0.5) * p.speed;
                        p.y += (Math.random() - 0.5) * p.speed;
                        p.life--;
                        p.opacity = (p.life / p.maxLife) * 0.5 + 0.1;
                    }
    
                    //Color
                    const [r, g, b] = getParticleColor().match(/\d+/g).map(Number);
    
                    //Draw
                    ctx.current.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.opacity})`;
                    ctx.current.fillRect(
                        canvasX - p.size / 2,
                        canvasY - p.size / 2,
                        p.size,
                        p.size
                    );
                }
            }

            particlesAnimationId.current = requestAnimationFrame(animateParticles);
        }, [getParticleColor]);
    //

    const updateCursor = useCallback(() => {
        if(!voidRef.current) return;

        const left = `${posRef.current.x - currentRadius}px`;
        const top = `${posRef.current.y - currentRadius}px`;

        if(voidRef.current.style.left !== left || voidRef.current.style.top !== top) {
            voidRef.current.style.left = left;
            voidRef.current.style.top = top;

            const rect = voidRef.current.getBoundingClientRect();

            if(!animationRef.current.lastDispatch || performance.now() - animationRef.current.lastDispatch > 16) {
                //Particles
                    voidArea.current = {
                        left: rect.left,
                        right: rect.right,
                        top: rect.top,
                        bottom: rect.bottom,
                        isActive: isActive
                    }

                    const particlesContainer = canvasRef?.current.parentElement;

                    if(particlesContainer) {
                        particlesContainer.style.left = left;
                        particlesContainer.style.top = top;
                    }
                //

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

                animationRef.current.lastDispatch = performance.now();
            }
        }

        animationRef.current.id = requestAnimationFrame(updateCursor);
    }, [isActive, currentRadius]);

    const handleMouseMove = useCallback((e) => {
        posRef.current = { x: e.clientX, y: e.clientY };
    }, []);

    //Init...
        useEffect(() => {
            const left = `${posRef.current.x - currentRadius}px`;
            const top = `${posRef.current.y - currentRadius}px`;

            if(voidRef.current) {
                voidRef.current.style.left = left;
                voidRef.current.style.top = top;
            }

            animationRef.current.id = requestAnimationFrame(updateCursor);
            window.addEventListener('mousemove', handleMouseMove);

            //Init Particles
                setupParticles();
                initParticles();
                animateParticles();
            //

            return () => {
                if(animationRef.current.id) cancelAnimationFrame(animationRef.current.id);
                cancelAnimationFrame(particlesAnimationId.current);
                window.removeEventListener('mousemove', handleMouseMove);
            }
        }, [updateCursor, handleMouseMove, initParticles, setupParticles, animateParticles]);
    //

    //Main...
    return (
        <>
            {/* Void */}
            <div 
                className='void'
                ref={voidRef}
                style={{
                    pointerEvents: 'none',
                    width: `${currentRadius * 2}px`,
                    height: `${currentRadius * 2}px`,
                    borderRadius: '50%',
                    background: `
                        radial-gradient(
                            circle at center,
                            ${getVoidColor} 0%,
                            ${getVoidColor} 40%,
                            rgba(${getVoidColor.match(/\d+/g).join(', ')}, 0.0) 50%,
                            transparent 80%
                        )
                    `,
                    transition: 'background-color 0.3s ease',
                    willChange: 'left, top'
                }}
            >
            </div>

            {/* Particles */}
            <div
                className='void-particles'
                style={{
                    pointerEvents: 'none',
                    width: `${currentRadius * 2}px`,
                    height: `${currentRadius * 2}px`,
                    borderRadius: '50%',
                }}
            >
                <canvas ref={canvasRef}></canvas>
            </div>
        </>
    )
}