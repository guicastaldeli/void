import { useCallback, useEffect, useRef, useState } from 'react';
import './styles/particles/particles.scss';

export default function Particles() {
    const canvasRef = useRef(null);
    const particlesRef = useRef([]);
    const dimensions = useRef({ w: 0, h: 0 });
    let animationId;

    
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
            const g = Math.round(fColor[1] + (sColor[1] - sColor[1]) * f);
            const b = Math.round(fColor[2] + (sColor[2] - sColor[2]) * f);

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
                })
            }

            window.addEventListener('voidStatusUpdate', handleVoidStatusUpdate);
            return () => window.removeEventListener('voidStatusUpdate', handleVoidStatusUpdate);
        }, [interpolateColor]);

        const setParticleColor = useCallback(() => {
            const color = voidColor?.color || initialColor;
            return color.match(/\d+/g).map(Number);
        }, [voidColor.color]);
    //

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const setup = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();

            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;

            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;

            ctx.scale(dpr, dpr);

            dimensions.current = {
                w: rect.width,
                h: rect.height
            }

            return dimensions.current;
        }

        const init = (w, h) => {
            const particles = [];
            const particleCount = 100;

            for(let i = 0; i < particleCount; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 5 + 2,
                    speed: Math.random() * 1 + 0.5,
                    opacity: Math.random() * 0.5 + 0.5,
                    sway: Math.random() * 1
                });
            }

            return particles;
        }

        //Animation
            const animate = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);

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
                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.opacity})`;
                    ctx.fillRect(p.x - p.size, p.y - p.size, p.size, p.size);
                }

                animationId = requestAnimationFrame(animate);
            }

            animate();
        //

        //Resize
            const resize = () => {
                const { w, h } = setup();
                const ow = dimensions.current.w;
                const oh = dimensions.current.h;

                if(ow > 0 && oh > 0) {
                    const scaleX = w / ow;
                    const scaleY = h / oh;

                    particlesRef.current.forEach(p => {
                        p.x *= scaleX;
                        p.y *= scaleY;
                    });
                }

                dimensions.current = { w: w, h: h }
            }

            resize();
            window.addEventListener('resize', resize);
        //

        //Init
        setup()
        particlesRef.current = init(dimensions.current.w, dimensions.current.h);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resize);
        }
    }, []);

    return (
        <>
            <div className="particles">
                <canvas ref={canvasRef}></canvas>
            </div>
        </>
    )
}