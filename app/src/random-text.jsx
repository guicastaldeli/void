import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
        initialSpeed: 50,
        maxCharStreams: 150,
        maxLengthText: 80,
        spawnRate: 0.0002,
        speedRange: [0.005, 0.001],
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
        const [voidPos, setVoidPos] = useState({ 
            left: 0,
            right: 0, 
            top: 0,
            bottom: 0,
            isActive: false,
            onDeleted: () => {}
        });

        useEffect(() => {
            const handleVoidUpdate = (e) => {
                setVoidPos({
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
            if(!voidPos.isActive) return false;

            const el = charsRef.current[cr.id];
            if(!el) return false;

            const charRect = el.getBoundingClientRect();

            const voidRect = {
                left: voidPos.left,
                right: voidPos.right,
                top: voidPos.top,
                bottom: voidPos.bottom
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
        }, [voidPos]);
    //

    //Update
        const updateCharPos = useCallback((cs, currentMaxLength, collStrength, onDeleted) => {
            const updX = cs.dir === 'right' ? cs.x + cs.speed : cs.x - cs.speed;

            if((cs.dir === 'right' && updX > 1.2) || (cs.dir === 'left' && updX < -0.2)) {
                return initalPos();
            }

            let updContent = cs.content;
            
            const char = genRandomChar();
            const addChange = 0.3 + timeFactor.current * 2.0;

            if(voidPos.isActive && charsRef.current[cs.id]) {
                const element = charsRef.current[cs.id];
                const charNodes = Array.from(element.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);

                if(charNodes.length > 0) {
                    const range = document.createRange();
                    let modifiedContent = updContent;
                    let hasDeleted = false;

                    for(let i = 0; i < updContent.length; i++) {
                        try {
                            range.setStart(charNodes[0], i);
                            range.setEnd(charNodes[0], i + 1);
                            const charRect = range.getBoundingClientRect();
                            
                            const coll = checkColl(charRect);

                            if(coll) {
                                modifiedContent = cs.dir === 'right'
                                    ? modifiedContent.slice(0, i) + modifiedContent.slice(i + 1)
                                    : modifiedContent.slice(0, i) + modifiedContent.slice(i + 1)
                                ;
                                i--;
                                hasDeleted = true;
                            }
                        } catch(e) {
                            console.error(e);
                        }
                    }

                    if(hasDeleted && onDeleted) onDeleted();
                    updContent = modifiedContent;

                    if(updContent.length === 0) return null;
                }
            }

            if(updContent.length < currentMaxLength && Math.random() < addChange) {
                updContent = cs.dir === 'right' 
                    ? updContent + char 
                    : char + updContent
                ;
            }

            return {
                ...cs,
                x: updX,
                content: updContent,
                maxLength: currentMaxLength,
                isColliding: collStrength > 0,
            }
        }, [initalPos, genRandomChar]);
        
        const updateChar = useCallback(() => {
            timePassed.current += config.initialSpeed;

            timeFactor.current = Math.min(timePassed.current / 500, 1);
            const currentMaxLength = 5 + Math.floor(timeFactor.current * config.maxLengthText);
            const spawnRate = config.spawnRate + timeFactor.current * 0.1;

            setChars(prev => {
                if(!Array.isArray(prev)) return [];

                const updated = prev.map(cs => {
                    const collStrength = checkColl(cs);
                    return updateCharPos(cs, currentMaxLength, collStrength, voidPos.onDeleted);
                }).filter(cs => cs !== null && cs.content.length > 0);
        
                if(Math.random() < spawnRate && updated.length < config.maxCharStreams) {
                    updated.push(initalPos());
                }
        
                return updated;
            });
        }, [checkColl, updateCharPos, initalPos, voidPos.onDeleted]);
    //

    useEffect(() => {
        const interval = setInterval(updateChar, config.initialSpeed);
        return () => clearInterval(interval);
    }, [updateChar, config.initialSpeed, voidPos.onDeleted]);

    useEffect(() => {
        return () => { charsRef.current = {} }
    }, []);

    //Main...
    return (
        <>
            <div className='-chars-container'>
                {chars.map((cs) => (
                    <span id='--chars-el' 
                        key={cs.id} 
                        ref={(el) => {
                            if(el) charsRef.current[cs.id] = el;
                            else delete charsRef.current[cs.id];
                        }}

                        style={{
                            position: 'absolute',
                            left: `${cs.x * 100}%`,
                            top: `${cs.y * 100}%`,
                            fontSize: `${cs.size}px`,
                            fontFamily: cs.font,
                            border: cs.isColliding ? '1px solid red' : 'transparent',
                        }}
                    >
                        {cs.content}
                    </span>
                ))}
            </div>
        </>
    )
}