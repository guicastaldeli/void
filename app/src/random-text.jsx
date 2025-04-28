import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import React from 'react';
import debounce from 'lodash.debounce';
import fontsData from './styles/font/fonts.scss';

export default function RandomText() {
    const [chars, setChars] = useState([]);
    const charsRef = useRef({});
    const timePassed = useRef(0);
    const timeFactor = useRef(0);
    const idCounter = useRef(0);
    const getFonts = useMemo(() => Object.values(fontsData || {}), [fontsData]);

    //Config
    const config = useMemo(() => ({
        initialSpeed: 1,
        maxCharStreams: 150,
        maxLengthText: 80,
        spawnRate: 0.0001,
        speedRange: [0.001, 0.0005],
        initialStreamLength: 5,
        sizeRange: [5, 50]
    }), []);

    //Random Char
    const genRandomChar = useCallback(() => {
        return String.fromCharCode(Math.floor(Math.random() * 128));
    }, []);

    //Initial Pos
    const initalPos = useCallback((ec = null) => {
        const updId = idCounter.current++;
        const content = ec?.content || genRandomChar();
        
        return {
            id: updId,
            content: content,
            x: Math.random() > 0.5 ? 0 : 1,
            y: Math.random() * 1.0,
            dir: Math.random() > 0.5 ? 'right' : 'left',
            speed: Math.random() * config.speedRange[0] + config.speedRange[1],
            maxLength: Math.floor(Math.random() * 10) + 5,
            font: getFonts[Math.floor(Math.random() * getFonts.length)],
            ref: null,
            isColliding: false,
            size: Math.floor(Math.random() * (config.sizeRange[1] - config.sizeRange[0])) + config.sizeRange[0],
            charEl: []
        }
    }, [config.speedRange, getFonts, genRandomChar]);

    useEffect(() => {
        const initialCount = Math.floor(Math.random() * 3) + 1;
        setChars(Array.from({ length: initialCount }, () => initalPos()));
    }, [initalPos]);
    
    //Cursor Void
        const [voidState, setVoidState] = useState({
            left: 0,
            right: 0, 
            top: 0,
            bottom: 0,
            isActive: false,
            onDeleted: () => {}
        });

        useEffect(() => {
            const handleVoidUpdate = (e) => {
                setVoidState({
                    left: e.detail.left,
                    right: e.detail.right,
                    top: e.detail.top,
                    bottom: e.detail.bottom,
                    isActive: e.detail.isActive,
                    onDeleted: e.detail.onDeleted || (() => {})
                });
            }

            window.addEventListener('cursorUpdate', handleVoidUpdate);
            return () => window.removeEventListener('cursorUpdate', handleVoidUpdate);
        }, []);

        const checkColl = useCallback((cr) => {
            if(!voidState.isActive) return false;

            const el = charsRef.current[cr.id];
            if(!el) return false;

            const charRect = el.getBoundingClientRect();

            const voidRect = {
                left: voidState.left,
                right: voidState.right,
                top: voidState.top,
                bottom: voidState.bottom
            }

            const collision = !(
                voidRect.left > charRect.right ||
                voidRect.right < charRect.left ||
                voidRect.top > charRect.bottom ||
                voidRect.bottom < charRect.top
            );

            if(!collision) return false;

            const overlapX = Math.min(charRect.right, voidRect.right) - Math.max(charRect.left, voidRect.left);
            const overlapY = Math.min(charRect.bottom, voidRect.bottom) - Math.max(charRect.top, voidRect.top);
            const overlapArea = overlapX * overlapY;

            const charArea = charRect.width * charRect.height;
            if(charArea <= 0) return false;

            const normalizedOverlap = overlapArea / charArea;

            return Math.pow(normalizedOverlap, 2);
        }, [voidState]);
    //

    //Update
        const updateCharPos = useCallback((cs, currentMaxLength, collStrength, onDeleted) => {
            const updX = cs.dir === 'right' ? cs.x + cs.speed : cs.x - cs.speed;

            if((cs.dir === 'right' && updX > 2.0) || (cs.dir === 'left' && updX < -1.0)) {
                return initalPos();
            }

            let updContent = cs.content;
            let hasDeleted = false;

            if(voidState.isActive && charsRef.current[cs.id]) {
                const element = charsRef.current[cs.id];
                const charNodes = element.childNodes[0];

                if(charNodes && charNodes.nodeType === Node.TEXT_NODE) {
                    let contentArray = updContent.split('');
                    const range = document.createRange();
                    const charLength = charNodes.length;

                    for(let i = 0; i < updContent.length; i++) {
                        if(contentArray[i] === ' ') continue;
                        if(i >= charLength) continue;

                        range.setStart(charNodes, i);
                        range.setEnd(charNodes, i + 1);

                        try {
                            const charRect = range.getBoundingClientRect();
                            const collisionX = charRect.right > voidState.left && charRect.left < voidState.right;
                            const collisionY = charRect.bottom > voidState.top && charRect.top < voidState.bottom;

                            if(collisionX && collisionY) {
                                contentArray[i] = ' ';
                                hasDeleted = true;
                            }
                        } catch(e) {
                            console.error(e);
                        }
                    }

                    updContent = contentArray.join('');
                }
            }

            //Add new chars
            const char = genRandomChar();
            const addChance = timeFactor.current / 5;
            if(updContent.length < currentMaxLength && Math.random() < addChance) {
                updContent = cs.dir === 'right' 
                    ? updContent + char 
                    : char + updContent
                ;
            }

            if(hasDeleted && onDeleted) {
                requestAnimationFrame(() => {
                    onDeleted();
                });
            }

            if(updContent.trim().length === 0) return null;

            return {
                ...cs,
                x: updX,
                content: updContent,
                maxLength: currentMaxLength,
                isColliding: collStrength > 0,
            }
        }, [initalPos, genRandomChar, voidState]);
        
        const updateChar = useCallback(() => {
            timePassed.current += config.initialSpeed;

            timeFactor.current = Math.min(timePassed.current / 1000, 1);
            const currentMaxLength = 5 + Math.floor(timeFactor.current * config.maxLengthText);
            const spawnRate = config.spawnRate + timeFactor.current * 0.1;

            setChars(prev => {
                if(!Array.isArray(prev)) return [];

                const updated = prev.map(cs => {
                    const collStrength = checkColl(cs);
                    return updateCharPos(cs, currentMaxLength, collStrength, voidState.onDeleted);
                }).filter(cs => cs !== null && cs.content.length > 0);
        
                if(Math.random() < spawnRate && updated.length < config.maxCharStreams) {
                    updated.push(initalPos());
                }
        
                return updated;
            });
        }, [checkColl, updateCharPos, initalPos, voidState.onDeleted]);
    //

    //Color
        const initalColor = 'rgb(50, 168, 82)';
        const finalColor = 'rgb(170, 58, 58)';

        const [voidColor, setVoidColor] = useState({
            color: initalColor,
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
                        color: interpolateColor(initalColor, finalColor, e.detail.progress),
                        progress: e.detail.progress
                    });
                });
            }

            window.addEventListener('voidStatusUpdate', handleVoidStatusUpdate);
            return () => window.removeEventListener('voidStatusUpdate', handleVoidStatusUpdate);
        }, [interpolateColor]);

        const setCharColor = useCallback(() => {
            return voidColor?.color || initalColor;
        }, [voidColor.color]);
    //

    useEffect(() => {
        let animationFrameId;
        let lastTime = performance.now();
        const targetFPS = 30;
        const targetFrameDuration = 1000 / targetFPS;
        let accumulatedTime = 0;

        const _animate = (currentTime) => {
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;
            accumulatedTime += deltaTime;

            while(accumulatedTime >= targetFrameDuration) {
                updateChar();
                accumulatedTime -= targetFrameDuration;
            }

            animationFrameId = requestAnimationFrame(_animate);
        }

        animationFrameId = requestAnimationFrame(_animate);
        return () => cancelAnimationFrame(animationFrameId);
    }, [updateChar, config.initialSpeed]);

    useEffect(() => {
        return () => { charsRef.current = {} }
    }, []);

    const setCharEl = useCallback((id) => (el) => {
        if(el) charsRef.current[id] = el;
        else delete charsRef.current[id];
    }, []);

    const CharEl = React.memo(({ cs }) => {
        return (
            <span 
                id='--chars-el'
                key={cs.id} 
                ref={ setCharEl(cs.id) }

                style={{
                    position: 'absolute',
                    left: `${cs.x * 100}%`,
                    top: `${cs.y * 100}%`,
                    fontSize: `${cs.size}px`,
                    fontFamily: cs.font,
                    color: setCharColor(),
                    transition: 'color 0.3s ease'
                }}
            >
                {cs.content}
            </span>
        );
    }, (prev, next) => {
        const keys = ['x', 'y', 'content', 'size', 'font'];
        return keys.every(key => prev.cs[key] === next.cs[key]);
    });

    //Main...
    return (
        <>
            <div className='-chars-container'>
                {chars.map((c) => (
                    <CharEl key={c.id} cs={c} />
                ))}
            </div>
        </>
    )
}