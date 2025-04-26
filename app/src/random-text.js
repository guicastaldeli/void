import { useState, useEffect, useRef } from 'react';

import fontsData from './styles/font/fonts.scss';
import './styles/font/fonts.scss';

export default function RandomText() {
    const config = {
        initialSpeed: 50,
        maxTextStreams: 150,
        maxLengthText: 80,
        spawnRate: 0.0002,
        speedRange: [0.05, 0.001],
    }

    const getFonts = Object.values(fontsData);
    
    const intervalRef = useRef(null);
    const timePassed = useRef(0);
    const [text, setText] = useState([]);
    const idCounter = useRef(0);

    useEffect(() => {
        const initialCount = Math.floor(Math.random() * 3) + 1;
        const initialTexts = Array.from({ length: initialCount }, () => initPos());
        setText(initialTexts);
    }, []);

    //Random Text
    const genRandomLetter = () => {
        const char = String.fromCharCode(Math.floor(Math.random() * 128));
        return char;
    }

    //Initial Pos
    const initPos = (id) => {
        idCounter.current += 1;
        return {
            id: id || idCounter.current,
            content: '',
            x: Math.random() > 0.5 ? 0 : 1,
            y: Math.random() * 1.0,
            dir: Math.random() > 0.5 ? 'right' : 'left',
            speed: Math.random() * config.speedRange[0] + config.speedRange[1],
            maxLength: Math.floor(Math.random() * 10) + 5,
            font: getFonts[Math.floor(Math.random() * getFonts.length)]
        }
    };

    //Update
    const updateText = () => {
        timePassed.current += config.initialSpeed;

        const timeFactor = Math.min(timePassed.current / 50000, 1);
        const currentMaxLength = 5 + Math.floor(timeFactor * config.maxLengthText);
        const spawnRate = config.spawnRate + timeFactor * 0.1;

        setText(prevText => {
            let newText = [...prevText];
            
            if(Math.random() < spawnRate && newText.length < config.maxTextStreams) newText.push(initPos());

           return newText.map(text => {
                const newX = text.dir === 'right' ? text.x + text.speed : text.x - text.speed;
                
                const growChange = 0.3 + timeFactor * 2.0;
                const grow = text.content.length < currentMaxLength && Math.random() < growChange;

                let newContent = text.content;

                if(grow)newContent = text.dir === 'right' ? text.content + genRandomLetter() : genRandomLetter() + text.content;

                if((text.dir === 'right' && newX > 1.2) || (text.dir === 'left' && newX <-0.2)) {
                    return {
                        ...initPos(text.id),
                        maxLength: currentMaxLength
                    }
                }

                return {
                    ...text,
                    x: newX,
                    content: newContent,
                    maxLength: Math.max(text.maxLength, currentMaxLength)
                }
           });
        });
    }

    useEffect(() => {
        intervalRef.current = setInterval(updateText, config.initialSpeed);
        return () => clearInterval(intervalRef.current);
    }, [config.initialSpeed]);

    useEffect(() => {
        if(!intervalRef.current) return;
        clearInterval(intervalRef.current);
        intervalRef.current = setInterval(updateText, config.initialSpeed);
    }, [config.initialSpeed]);

    //Main
    return (
        <>
            <div className='-text-container'>
                {text.map((t) => (
                    <div id='--side-container' key={t.id}
                        style={{
                            position: 'absolute',
                            left: `${t.x * 100}%`,
                            top: `${t.y * 100}%`,
                            fontFamily: t.font
                        }}
                    >
                        {t.content}
                    </div>
                ))}
            </div>
        </>
    )
}