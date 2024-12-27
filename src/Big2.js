import React, { useState, useEffect } from 'react';
import { Card } from 'react-bootstrap';
import { Alert } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css'

const SUITS = ['♦', '♣', '♥', '♠'];
const RANKS = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];

class PlayingCard {
    constructor(suit, rank) {
        this.suit = suit;
        this.rank = rank;
    }

    toString() {
        return `${this.suit}${this.rank}`;
    }

    getValue() {
        const rankValue = RANKS.indexOf(this.rank);
        const suitValue = SUITS.indexOf(this.suit);
        return (rankValue * SUITS.length) + suitValue;
    }

    getRankValue() {
        return RANKS.indexOf(this.rank);
    }
}

const getCardColor = (suit) => {
    return ['♥', '♦'].includes(suit) ? 'red' : 'black';
};

const Big2Game = () => {
    const [deck, setDeck] = useState([]);
    const [players, setPlayers] = useState([[], [], [], []]);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [lastPlay, setLastPlay] = useState([]);
    const [selectedCards, setSelectedCards] = useState([]);
    const [startingPlayer, setStartingPlayer] = useState(null);
    const [consecutivePasses, setConsecutivePasses] = useState(0);
    const [lastPlayPlayer, setLastPlayPlayer] = useState(null);
    const [gameWinner, setGameWinner] = useState(null);
    const [error, setError] = useState('');
    const [isFirstTurn, setIsFirstTurn] = useState(true);

    useEffect(() => {
        initializeGame();
    }, []);

    const initializeGame = () => {
        const newDeck = [];
        SUITS.forEach(suit => {
            RANKS.forEach(rank => {
                newDeck.push(new PlayingCard(suit, rank));
            });
        });

        for (let i = newDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
        }

        const newPlayers = [[], [], [], []];
        for (let i = 0; i < 52; i++) {
            newPlayers[i % 4].push(newDeck[i]);
        }

        let startingPlayer = -1;
        newPlayers.forEach((hand, index) => {
            if (hand.some(card => card.suit === '♦' && card.rank === '3')) {
                startingPlayer = index;
            }
        });

        setDeck(newDeck);
        setPlayers(newPlayers);
        setCurrentPlayer(startingPlayer);
        setStartingPlayer(startingPlayer);
        setConsecutivePasses(0);
        setLastPlayPlayer(null);
        setLastPlay([]);
        setGameWinner(null);
        setError('');
        setIsFirstTurn(true);
        setSelectedCards([]);
    };

    // 카드 조합 체크 함수들
    const isSingle = (cards) => cards.length === 1;

    const isPair = (cards) => {
        return cards.length === 2 &&
            cards[0].rank === cards[1].rank;
    };

    const isTriple = (cards) => {
        return cards.length === 3 &&
            cards.every(card => card.rank === cards[0].rank);
    };

    const isStraight = (cards) => {
        if (cards.length !== 5) return false;

        const sortedRanks = cards.map(card => RANKS.indexOf(card.rank))
            .sort((a, b) => a - b);

        for (let i = 1; i < sortedRanks.length; i++) {
            if (sortedRanks[i] !== sortedRanks[i - 1] + 1) return false;
        }
        return true;
    };

    const isFlush = (cards) => {
        if (cards.length !== 5) return false;
        return cards.every(card => card.suit === cards[0].suit);
    };

    const isFullHouse = (cards) => {
        if (cards.length !== 5) return false;

        const rankCounts = {};
        cards.forEach(card => {
            rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
        });

        const counts = Object.values(rankCounts);
        return counts.length === 2 && counts.includes(2) && counts.includes(3);
    };

    const isFourOfAKind = (cards) => {
        if (cards.length !== 5) return false;

        const rankCounts = {};
        cards.forEach(card => {
            rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
        });

        return Object.values(rankCounts).includes(4);
    };

    const isStraightFlush = (cards) => {
        return isFlush(cards) && isStraight(cards);
    };

    // 조합 등급 계산
    const getHandRank = (cards) => {
        if (isStraightFlush(cards)) return 5;
        if (isFourOfAKind(cards)) return 4;
        if (isFullHouse(cards)) return 3;
        if (isFlush(cards)) return 2;
        if (isStraight(cards)) return 1;
        return 0;
    };

    // 조합 값 계산
    const getHandValue = (cards) => {
        if (cards.length === 1) return cards[0].getValue();

        if (cards.length === 2 || cards.length === 3) {
            return Math.max(...cards.map(card => card.getValue()));
        }

        if (cards.length === 5) {
            const rank = getHandRank(cards);
            const highestCard = Math.max(...cards.map(card => card.getValue()));
            return rank * 1000 + highestCard;
        }

        return 0;
    };
    const isValidCombination = (cards) => {
        if (!cards.length) return false;

        return isSingle(cards) ||
            isPair(cards) ||
            isTriple(cards) ||
            isStraight(cards) ||
            isFlush(cards) ||
            isFullHouse(cards) ||
            isFourOfAKind(cards) ||
            isStraightFlush(cards);
    };

    const isValidPlay = (selectedCards, lastPlay) => {
        if (isFirstTurn) {
            const hasDiamond3 = selectedCards.some(card =>
                card.suit === '♦' && card.rank === '3'
            );
            if (!hasDiamond3) {
                return { isValid: false, message: '첫 턴에는 ♦3을 내야 합니다.' };
            }
        }

        if (!isValidCombination(selectedCards)) {
            return { isValid: false, message: '유효하지 않은 카드 조합입니다.' };
        }

        if (lastPlay.length === 0) {
            return { isValid: true, message: '' };
        }

        if (selectedCards.length !== lastPlay.length) {
            return { isValid: false, message: '이전 플레이와 같은 수의 카드를 내야 합니다.' };
        }

        const selectedValue = getHandValue(selectedCards);
        const lastValue = getHandValue(lastPlay);

        if (selectedValue <= lastValue) {
            return { isValid: false, message: '이전 플레이보다 높은 조합을 내야 합니다.' };
        }

        return { isValid: true, message: '' };
    };

    const handleCardClick = (playerIndex, card) => {
        if (playerIndex !== currentPlayer || gameWinner !== null) return;

        const cardIndex = selectedCards.findIndex(c =>
            c.suit === card.suit && c.rank === card.rank
        );

        if (cardIndex === -1) {
            setSelectedCards([...selectedCards, card]);
        } else {
            setSelectedCards(selectedCards.filter((_, i) => i !== cardIndex));
        }

        setError('');
    };

    const checkGameEnd = (newPlayers) => {
        const winnerIndex = newPlayers.findIndex(hand => hand.length === 0);
        if (winnerIndex !== -1) {
            setGameWinner(winnerIndex);
            return true;
        }
        return false;
    };

    const handlePlay = () => {
        if (gameWinner !== null) return;

        const nextPlayer = (currentPlayer + 1) % 4;

        if (selectedCards.length === 0) {
            setConsecutivePasses(prev => prev + 1);

            if (consecutivePasses === 2 && nextPlayer === lastPlayPlayer) {
                setLastPlay([]);
                setConsecutivePasses(0);
                setLastPlayPlayer(null);
            } else {
                setCurrentPlayer(nextPlayer);
            }
            return;
        }

        const { isValid, message } = isValidPlay(selectedCards, lastPlay);
        if (!isValid) {
            setError(message);
            return;
        }

        const newPlayers = [...players];
        newPlayers[currentPlayer] = players[currentPlayer].filter(card =>
            !selectedCards.some(selected =>
                selected.suit === card.suit && selected.rank === card.rank
            )
        );

        if (checkGameEnd(newPlayers)) {
            setPlayers(newPlayers);
            return;
        }

        setPlayers(newPlayers);
        setLastPlay(selectedCards);
        setSelectedCards([]);
        setCurrentPlayer(nextPlayer);
        setConsecutivePasses(0);
        setLastPlayPlayer(currentPlayer);
        setIsFirstTurn(false);
        setError('');
    };

    return (
        <div className="p-4">
            {error && (
                <Alert variant="destructive" className="mb-4">
                    <p>{error}</p>
                </Alert>
            )}

            {gameWinner !== null && (
                <Alert className="mb-4">
                    <p className="text-2xl font-bold">Player {gameWinner + 1} 승리!</p>
                </Alert>
            )}

            <div className="grid grid-cols-1 gap-2" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                {players.map((hand, index) => (
                    <div key={index} className="flex-row items-center gap-4 h-10 m-4" >
                        <div className="text-2xl min-w-[200px] m-0 p-0" 
                            style={{
                                color: (currentPlayer === index ? 'red' : 'black'),
                                fontWeight: (currentPlayer === index ? 'bold' : 'normal')
                            }}>
                            Player {index + 1}
                        </div>
                        <div className="flex-row flex-wrap h-24 mb-1">
                            {hand
                                .slice()
                                .sort((a, b) => a.getValue() - b.getValue())
                                .map((card, cardIndex) => (
                                    <div key={cardIndex} className="relative mr-2">
                                        {card.suit === '♦' && card.rank === '3' && (
                                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 
                                                          text-red-500 text-2xl font-bold">

                                            </div>
                                        )}
                                        <Card
                                            className={`${selectedCards.some(selected =>
                                                selected.suit === card.suit &&
                                                selected.rank === card.rank
                                            ) ? 'border-2 border-orange' : 'border border-gray'
                                                }`}
                                            onClick={() => handleCardClick(index, card)}
                                        >
                                            <Card.Body
                                                className="flex justify-center items-center p-0 text-2xl"
                                                style={{ color: getCardColor(card.suit), height: 50, width: 30 }}>
                                                {card.toString()}
                                            </Card.Body>
                                        </Card>
                                    </div>
                                ))}
                        </div>
                    </div>
                ))}

                <div className="flex-row bg-white/90 p-5 mb-24 h-2">
                    
                        <p className="text-2xl font-bold mb-4 text-orangered">마지막 플레이:</p>
                        {lastPlay.map((card, index) => (
                            <Card
                                key={index}
                                className="border border-gray-300"
                            >
                                <Card.Body className="flex justify-center items-center p-0 
                                                     text-2xl" style={{ color: getCardColor(card.suit) }}>
                                    {card.toString()}
                                </Card.Body>
                            </Card>
                        ))}
            
                </div>
            </div>

            <div className="fixed left-1/2 transform -translate-x-1/2 
                          bg-white/90 p-3 rounded-lg shadow-md z-10 text-center" >
                <button
                    onClick={handlePlay}
                    className="text-2xl mt-1 bg-blue text-red rounded hover:bg-blue
                             transition-colors min-w-[150px]"
                    disabled={gameWinner !== null}
                >
                    {selectedCards.length === 0 ? '패스' : '플레이'}
                </button>
                <div>
                {gameWinner !== null && (
                <button
                        onClick={initializeGame}
                        className="ml-4 px-6 py-3 text-2xl bg-green-500 text-black rounded 
                             hover:bg-green-600 transition-colors"
                    >
                        새 게임
                 </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Big2Game;