import { use, useCallback, useEffect, useRef, useState } from 'react';
import './styles/particles/particles.scss';

export default function Particles() {
    const dimensions = useRef({ w: 0, h: 0 });
    const canvasRef = useRef(null);
    const ctx = useRef(null);
    const particlesRef = useRef([]);
    const animationId = useRef(null);
    const zoomTimeout = useRef(null);
    
    //Color
        const initialColor = 'rgb(185, 185, 185)';
        const finalColor = 'rgb(255, 255, 255)';

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

        const setParticleColor = useCallback(() => {
            const color = voidColor?.color || initialColor;
            return color.match(/\d+/g).map(Number);
        }, []);

        useEffect(() => {
            const handleVoidStatusUpdate = (e) => {
                if(!e.detail) return;

                requestAnimationFrame(() => {
                    setVoidColor({
                        color: interpolateColor(initialColor, finalColor, e.detail.progress),
                        progress: e.detail.progress
                    });
                })
            }

            window.addEventListener('voidStatusUpdate', handleVoidStatusUpdate);
            return () => window.removeEventListener('voidStatusUpdate', handleVoidStatusUpdate);
        }, [interpolateColor]);
    //

    const setup = useCallback(() => {
        //Canvas
            const canvas = canvasRef.current;
            if(!canvas) return null;
        //

        const container = canvas.parentElement;
        const displayWidth = container.clientWidth;
        const displayHeight = container.clientHeight;

        const zoom = window.visualViewport?.scale || 1;
        const preciseZoom = Math.max(0.1, Math.min(zoom, 3));
        
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.round(displayWidth * dpr / preciseZoom);
        canvas.height = Math.round(displayHeight * dpr / preciseZoom);

        //Ctx
            ctx.current = canvas.getContext('2d');
            ctx.current.scale(dpr / preciseZoom, dpr / preciseZoom);
        //

        const updDimensions = {
            w: displayWidth,
            h: displayHeight,
            zoom: preciseZoom
        }

        dimensions.current = updDimensions;
        return updDimensions;
    }, []);

    const init = useCallback((w, h) => {
        const particles = [];
        const particleCount = 100;

        for(let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvasRef.current.width,
                y: Math.random() * canvasRef.current.height,
                size: Math.random() * 5 + 2,
                speed: Math.random() * 1 + 0.5,
                opacity: Math.random() * 0.5 + 0.5,
                sway: Math.random() * 1
            });
        }

        return particles;
    }, []);

    //Animation
        const animate = useCallback(() => {
            const canvas = canvasRef.current;
            const width = canvas.width / (window.devicePixelRatio / (dimensions.current?.zoom || 1));
            const height = canvas.height / (window.devicePixelRatio / (dimensions.current?.zoom || 1));

            ctx.current.clearRect(
                -1, -1,
                width + 2,
                height + 2
            );

            for(let i = 0; i < particlesRef.current.length; i++) {
                const p = particlesRef.current[i];

                p.y += p.speed;
                p.x += Math.sin(p.y * 0.01) * p.sway;

                if(p.y > dimensions.current.h) {
                    p.y = 0;
                    p.x = Math.random() * dimensions.current.w;
                }

                //Color
                const [r, g, b] = setParticleColor();

                //Draw
                ctx.current.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.opacity})`;
                ctx.current.fillRect(p.x - p.size, p.y - p.size, p.size, p.size);
            }

            animationId.current = requestAnimationFrame(animate);
        }, [setParticleColor]);
    //

    //Resize
        const resize = useCallback(() => {
            if(zoomTimeout.current) clearTimeout(zoomTimeout.current);

            zoomTimeout.current = setTimeout(() => {
                const updDimensions = setup();
                if(!updDimensions) return;
    
                if(dimensions.current.w !== updDimensions.w || dimensions.current.h !== updDimensions.h) {
                    const scaleX = updDimensions.w / dimensions.current.w;
                    const scaleY = updDimensions.h / dimensions.current.h;

                    particlesRef.current.forEach(p => {
                        p.x *= scaleX;
                        p.y *= scaleY;
                    });
                }

                dimensions.current = updDimensions;
            }, 100)
        }, [setup]);
    //

    //Init...
    useEffect(() => {
        const initDimensions = setup();
        particlesRef.current = init(initDimensions.w, initDimensions.h);
        animate();
    
        //Resize
            window.addEventListener('resize', resize);
            window.visualViewport?.addEventListener('resize', resize);
        //

        //Zoom
            const zoom = () => {
                clearTimeout(zoomTimeout.current);
                zoomTimeout.current = setTimeout(resize, 100);
            }

            window.addEventListener('wheel', zoom, { passive: true });
        //

        return () => {
            cancelAnimationFrame(animationId.current);
            window.removeEventListener('resize', resize);
        }
    }, [animate, resize, init, setup]);

    //Main...
    return (
        <div className="particles">
            <canvas ref={canvasRef}></canvas>
        </div>
    )
}