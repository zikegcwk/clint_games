class MemoryGame {
    constructor() {
        this.cardTypes = [
            { name: 'chicken', emoji: '🐓', image: 'cards/chicken jockey.png' },
            { name: 'dirt', emoji: '🧱', image: 'cards/dirt block.png' },
            { name: 'zombie', emoji: '🧟', image: 'cards/zombie.png' },
            { name: 'spider', emoji: '🕷️', image: 'cards/spider.png' },
            { name: 'creeper', emoji: '💥', image: 'cards/creeper.png' },
            { name: 'skeleton', emoji: '💀', image: 'cards/skeleton.png' }
        ];
        
        this.players = {
            player1: {
                board: document.getElementById('cards1'),
                timer: document.getElementById('timer1'),
                status: document.getElementById('status1'),
                flippedCards: [],
                matchedPairs: 0,
                startTime: null,
                endTime: null,
                isPlaying: false,
                isComplete: false,
                score: 0
            },
            player2: {
                board: document.getElementById('cards2'),
                timer: document.getElementById('timer2'),
                status: document.getElementById('status2'),
                flippedCards: [],
                matchedPairs: 0,
                startTime: null,
                endTime: null,
                isPlaying: false,
                isComplete: false,
                score: 0
            }
        };
        
        this.gameOverModal = document.getElementById('gameOverModal');
        this.nextLevelBtn = document.getElementById('nextLevelBtn');
        
        // Celebration modal
        this.celebrationModal = document.getElementById('celebrationModal');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        
        // Level progression system
        this.currentLevel = 1; // Start at Level 1
        this.currentGame = 1;
        this.levelComplete = false;
        this.totalLevels = 3;
        
        // Preview phase for Level 2
        this.previewPhaseActive = false;
        
        // Track overall winner
        this.levelWinners = {
            level1: null,
            level2: null,
            level3: null
        };
        
        // Track level times
        this.levelTimes = {
            level1: { player1: null, player2: null },
            level2: { player1: null, player2: null },
            level3: { player1: null, player2: null }
        };
        
        // UI elements for scoring
        this.gameCounter = document.getElementById('gameCounter');
        this.gameTotal = document.getElementById('gameTotal');
        this.score1Display = document.getElementById('score1');
        this.score2Display = document.getElementById('score2');
        this.levelDisplay = document.getElementById('levelDisplay');
        
        this.init();
    }
    
    init() {
        this.createBoards();
        this.setupEventListeners();
        this.updateStatus();
        this.updateUI();
        
        // Start preview phase for Level 2 and 3
        if (this.currentLevel === 2 || this.currentLevel === 3) {
            this.startPreviewPhase();
        }
        
        // Double-check buttons after a short delay
        setTimeout(() => {
            console.log('Checking buttons after delay...');
            const testLevel3Btn = document.getElementById('testLevel3Btn');
            console.log('Level 3 button after delay:', testLevel3Btn);
            if (testLevel3Btn) {
                console.log('Button is clickable:', testLevel3Btn.click);
            }
        }, 1000);
    }
    
    createBoards() {
        // Create cards for each player
        Object.keys(this.players).forEach(playerKey => {
            const player = this.players[playerKey];
            const cards = this.generateCards();
            this.renderBoard(player.board, cards, playerKey);
        });
    }
    
    getLevelConfig() {
        if (this.currentLevel === 1) {
            return {
                cardsPerBoard: 6,
                pairsPerBoard: 3,
                gamesInLevel: 1,
                cardTypes: this.cardTypes.slice(0, 3) // Only first 3 types for Level 1
            };
        } else if (this.currentLevel === 2) {
            return {
                cardsPerBoard: 12,
                pairsPerBoard: 6,
                gamesInLevel: 1, // Changed to 1 for testing
                cardTypes: this.cardTypes // All 6 types for Level 2
            };
        } else if (this.currentLevel === 3) {
            return {
                cardsPerBoard: 12,
                pairsPerBoard: 6,
                gamesInLevel: 1,
                cardTypes: this.cardTypes // All 6 types for Level 3
            };
        }
    }
    
    generateCards() {
        const config = this.getLevelConfig();
        const cards = [];
        
        config.cardTypes.forEach(type => {
            cards.push({ ...type, id: `${type.name}-1` });
            cards.push({ ...type, id: `${type.name}-2` });
        });
        
        // Verify we have the correct number of cards
        if (cards.length !== config.cardsPerBoard) {
            console.error(`Card generation error: Expected ${config.cardsPerBoard} cards, got`, cards.length);
        }
        
        // Shuffle the cards
        const shuffled = this.shuffleArray(cards);
        
        // Log the shuffled cards for debugging
        console.log(`Level ${this.currentLevel} - Generated cards:`, shuffled.map(c => c.id));
        
        return shuffled;
    }
    
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    renderBoard(boardElement, cards, playerKey) {
        boardElement.innerHTML = '';
        
        // Set grid layout based on level
        const config = this.getLevelConfig();
        if (this.currentLevel === 1) {
            boardElement.style.gridTemplateColumns = 'repeat(3, 1fr)';
            boardElement.style.gridTemplateRows = 'repeat(2, 1fr)';
        } else {
            // Level 2 and 3 both use 4x3 grid
            boardElement.style.gridTemplateColumns = 'repeat(4, 1fr)';
            boardElement.style.gridTemplateRows = 'repeat(3, 1fr)';
        }
        
        cards.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.dataset.cardId = card.id;
            cardElement.dataset.player = playerKey;
            cardElement.dataset.index = index;
            
            // Create card back (face down)
            const cardBack = document.createElement('div');
            cardBack.className = 'card-back';
            cardBack.innerHTML = '❓';
            
            // Create card front (face up)
            const cardFront = document.createElement('div');
            cardFront.className = 'card-front';
            const img = document.createElement('img');
            img.src = card.image;
            img.alt = card.name;
            cardFront.appendChild(img);
            
            cardElement.appendChild(cardBack);
            cardElement.appendChild(cardFront);
            
            boardElement.appendChild(cardElement);
        });
    }
    
    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        try {
            // Add click listeners to all cards
            document.addEventListener('click', (e) => {
                if (e.target.closest('.card')) {
                    const card = e.target.closest('.card');
                    const playerKey = card.dataset.player;
                    this.handleCardClick(card, playerKey);
                }
            });
        
        // Next level button
        this.nextLevelBtn.addEventListener('click', () => {
            this.resetGame();
        });
        
        // Reset button
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetGame();
            });
        }
        
        // Test Level 2 button
        const testLevel2Btn = document.getElementById('testLevel2Btn');
        console.log('Looking for testLevel2Btn:', testLevel2Btn);
        if (testLevel2Btn) {
            testLevel2Btn.addEventListener('click', () => {
                console.log('Test Level 2 button clicked');
                this.currentLevel = 2;
                this.currentGame = 1;
                this.levelComplete = false;
                this.previewPhaseActive = false;
                
                // Reset player states
                Object.keys(this.players).forEach(playerKey => {
                    const player = this.players[playerKey];
                    player.flippedCards = [];
                    player.matchedPairs = 0;
                    player.startTime = null;
                    player.endTime = null;
                    player.isPlaying = false;
                    player.isComplete = false;
                    player.status.textContent = 'Ready to play!';
                    
                    // Stop timer
                    this.stopTimer(playerKey);
                    player.timer.textContent = '00:00';
                });
                
                // Clear any stuck cards
                document.querySelectorAll('.card').forEach(card => {
                    card.classList.remove('flipped', 'matched');
                });
                
                this.updateUI();
                this.createBoards();
                
                // Start preview phase
                setTimeout(() => {
                    this.startPreviewPhase();
                }, 100);
            });
        }
        
        // Test Level 3 button
        const testLevel3Btn = document.getElementById('testLevel3Btn');
        if (testLevel3Btn) {
            testLevel3Btn.addEventListener('click', () => {
                this.currentLevel = 3;
                this.currentGame = 1;
                this.levelComplete = false;
                this.previewPhaseActive = false;
                
                // Reset player states
                Object.keys(this.players).forEach(playerKey => {
                    const player = this.players[playerKey];
                    player.flippedCards = [];
                    player.matchedPairs = 0;
                    player.startTime = null;
                    player.endTime = null;
                    player.isPlaying = false;
                    player.isComplete = false;
                    player.status.textContent = 'Ready to play!';
                    
                    // Stop timer
                    this.stopTimer(playerKey);
                    player.timer.textContent = '00:00';
                });
                
                // Clear any stuck cards
                document.querySelectorAll('.card').forEach(card => {
                    card.classList.remove('flipped', 'matched');
                });
                
                this.updateUI();
                this.createBoards();
                
                // Start preview phase
                setTimeout(() => {
                    this.startPreviewPhase();
                }, 100);
            });
        }
        
        // Play again button (celebration modal)
        if (this.playAgainBtn) {
            this.playAgainBtn.addEventListener('click', () => {
                this.restartFromBeginning();
            });
        }
        
        console.log('Event listeners setup complete');
        } catch (error) {
            console.error('Error setting up event listeners:', error);
        }
    }
    
    handleCardClick(card, playerKey) {
        const player = this.players[playerKey];
        
        // Don't allow clicks during preview phase
        if (this.previewPhaseActive) {
            return;
        }
        
        // Don't allow clicks if player is complete or card is already flipped/matched
        if (player.isComplete || 
            card.classList.contains('flipped') || 
            card.classList.contains('matched')) {
            return;
        }
        
        // Prevent clicking if we're already processing a match
        if (player.flippedCards.length >= 2) {
            return;
        }
        
        // Start timer on first card flip
        if (!player.isPlaying) {
            player.isPlaying = true;
            player.startTime = Date.now();
            this.startTimer(playerKey);
        }
        
        // Flip the card
        this.flipCard(card, playerKey);
        
        // Add to flipped cards
        player.flippedCards.push(card);
        
        // Check if we have 2 cards flipped
        if (player.flippedCards.length === 2) {
            this.checkMatch(playerKey);
        }
    }
    
    flipCard(card, playerKey) {
        card.classList.add('flipped');
    }
    
    checkMatch(playerKey) {
        const player = this.players[playerKey];
        const [card1, card2] = player.flippedCards;
        
        const card1Type = card1.dataset.cardId.split('-')[0];
        const card2Type = card2.dataset.cardId.split('-')[0];
        
        console.log(`Checking match: ${card1Type} vs ${card2Type}`);
        
        if (card1Type === card2Type) {
            // Match found!
            console.log('Match found!');
            this.handleMatch(playerKey);
        } else {
            // No match, flip cards back
            console.log('No match, flipping back');
            this.handleNoMatch(playerKey);
        }
    }
    
    handleMatch(playerKey) {
        const player = this.players[playerKey];
        const [card1, card2] = player.flippedCards;
        
        // Mark cards as matched
        card1.classList.add('matched');
        card2.classList.add('matched');
        
        // Update player state
        player.matchedPairs++;
        player.flippedCards = [];
        
        // Update status
        this.updateStatus();
        
        // Check if player completed the game
        const config = this.getLevelConfig();
        if (player.matchedPairs === config.pairsPerBoard) {
            this.completePlayer(playerKey);
        }
    }
    
    handleNoMatch(playerKey) {
        const player = this.players[playerKey];
        const [card1, card2] = player.flippedCards;
        
        // Wait a bit then flip cards back
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            
            player.flippedCards = [];
        }, 1000);
    }
    
    completePlayer(playerKey) {
        const player = this.players[playerKey];
        player.isComplete = true;
        player.endTime = Date.now();
        this.stopTimer(playerKey);
        
        player.status.textContent = `🎉 Completed in ${this.formatTime(player.endTime - player.startTime)}!`;
        
        // Check if both players are complete
        if (this.players.player1.isComplete && this.players.player2.isComplete) {
            this.determineGameWinner();
        }
    }
    
    startTimer(playerKey) {
        const player = this.players[playerKey];
        player.timerInterval = setInterval(() => {
            if (player.startTime) {
                const elapsed = Date.now() - player.startTime;
                player.timer.textContent = this.formatTime(elapsed);
            }
        }, 100);
    }
    
    stopTimer(playerKey) {
        const player = this.players[playerKey];
        if (player.timerInterval) {
            clearInterval(player.timerInterval);
        }
    }
    
    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    updateStatus() {
        const config = this.getLevelConfig();
        Object.keys(this.players).forEach(playerKey => {
            const player = this.players[playerKey];
            if (!player.isComplete && player.isPlaying) {
                player.status.textContent = `Matched: ${player.matchedPairs}/${config.pairsPerBoard} pairs`;
            }
        });
    }
    
    updateUI() {
        const config = this.getLevelConfig();
        
        // Update level display
        if (this.levelDisplay) {
            this.levelDisplay.textContent = this.currentLevel;
        }
        
        // Update game counter and total (both levels now show 1 of 1)
        if (this.gameCounter && this.gameTotal) {
            this.gameCounter.textContent = '1';
            this.gameTotal.textContent = 'of 1';
        }
        
        // Update scores
        if (this.score1Display) {
            this.score1Display.textContent = this.players.player1.score;
        }
        if (this.score2Display) {
            this.score2Display.textContent = this.players.player2.score;
        }
    }
    
    startPreviewPhase() {
        console.log(`Starting preview phase for Level ${this.currentLevel}...`);
        this.previewPhaseActive = true;
        
        // Add preview phase class to game container
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.classList.add('preview-phase');
        }
        
        // Set preview duration based on level
        const previewDuration = this.currentLevel === 3 ? 1 : 3;
        
        // Update status messages with countdown
        let countdown = previewDuration;
        this.players.player1.status.textContent = `📖 Preview phase - Memorize the cards! (${countdown}s)`;
        this.players.player2.status.textContent = `📖 Preview phase - Memorize the cards! (${countdown}s)`;
        
        // Flip all cards face up
        const cards = document.querySelectorAll('.card');
        console.log(`Found ${cards.length} cards to flip`);
        cards.forEach(card => {
            card.classList.add('flipped');
        });
        
        // Countdown timer
        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                this.players.player1.status.textContent = `📖 Preview phase - Memorize the cards! (${countdown}s)`;
                this.players.player2.status.textContent = `📖 Preview phase - Memorize the cards! (${countdown}s)`;
            }
        }, 1000);
        
        // After preview duration, flip all cards back down
        setTimeout(() => {
            console.log('Preview phase ending, flipping cards back down...');
            clearInterval(countdownInterval);
            document.querySelectorAll('.card').forEach(card => {
                card.classList.remove('flipped');
            });
            
            // Remove preview phase class
            if (gameContainer) {
                gameContainer.classList.remove('preview-phase');
            }
            
            this.previewPhaseActive = false;
            
            // Update status messages
            this.players.player1.status.textContent = 'Ready to play!';
            this.players.player2.status.textContent = 'Ready to play!';
            console.log('Preview phase complete!');
        }, previewDuration * 1000);
    }
    
    determineGameWinner() {
        const player1 = this.players.player1;
        const player2 = this.players.player2;
        
        const time1 = player1.endTime - player1.startTime;
        const time2 = player2.endTime - player2.startTime;
        
        console.log(`Both players completed! Player 1: ${this.formatTime(time1)}, Player 2: ${this.formatTime(time2)}`);
        
        // For testing: each level is just one game, so go directly to level completion
        this.currentGame++;
        this.updateUI();
        
        // Check if level is complete
        const config = this.getLevelConfig();
        console.log(`Current game: ${this.currentGame}, Games in level: ${config.gamesInLevel}`);
        if (this.currentGame > config.gamesInLevel) {
            console.log('Level complete!');
            
            // Store the level times and winner first
            this.storeLevelResults(time1, time2);
            
            // Check if this is Level 3 - go directly to celebration
            if (this.currentLevel === 3) {
                console.log('Level 3 complete! Going directly to celebration...');
                this.showCelebration();
            } else {
                console.log(`Level ${this.currentLevel} complete! Showing level completion modal...`);
                this.showLevelComplete();
            }
        }
    }
    

    
    storeLevelResults(time1, time2) {
        // Determine level winner
        let levelWinner = null;
        
        if (time1 < time2) {
            levelWinner = 'Player 1';
        } else if (time2 < time1) {
            levelWinner = 'Player 2';
        } else {
            levelWinner = 'Tie';
        }
        
        // Store the level winner
        this.levelWinners[`level${this.currentLevel}`] = levelWinner;
        
        // Store the level times
        this.levelTimes[`level${this.currentLevel}`] = {
            player1: time1,
            player2: time2
        };
        
        this.levelComplete = true;
    }
    
    showLevelComplete() {
        const player1 = this.players.player1;
        const player2 = this.players.player2;
        
        // Both levels now use single game timing
        const time1 = player1.endTime - player1.startTime;
        const time2 = player2.endTime - player2.startTime;
        document.getElementById('result1').textContent = this.formatTime(time1);
        document.getElementById('result2').textContent = this.formatTime(time2);
        
        // Determine level winner
        const winnerElement = document.getElementById('winner');
        let levelWinner = null;
        
        if (time1 < time2) {
            winnerElement.textContent = `🏆 Player 1 wins Level ${this.currentLevel}!`;
            levelWinner = 'Player 1';
        } else if (time2 < time1) {
            winnerElement.textContent = `🏆 Player 2 wins Level ${this.currentLevel}!`;
            levelWinner = 'Player 2';
        } else {
            winnerElement.textContent = `🤝 Level ${this.currentLevel} tied!`;
            levelWinner = 'Tie';
        }
        
        // Show regular level completion modal for Levels 1 and 2
        this.nextLevelBtn.textContent = 'Next Level';
        this.gameOverModal.style.display = 'flex';
    }
    
    prepareNextGame() {
        // This method is no longer needed since each level is just one game
        // But keeping it for potential future use
        const winnerElement = document.getElementById('winner');
        winnerElement.textContent = `Level ${this.currentLevel} Complete`;
        
        this.nextLevelBtn.textContent = 'Next Level';
    }
    
    showCelebration() {
        console.log('🎉 Showing celebration modal!');
        // Determine overall winner
        const overallWinner = this.determineOverallWinner();
        
        // Update celebration content
        document.getElementById('championName').textContent = overallWinner;
        document.getElementById('finalWinner').textContent = overallWinner;
        
        // Update level times in the celebration modal
        this.updateLevelTimesDisplay();
        
        // Hide the regular level completion modal first
        this.gameOverModal.style.display = 'none';
        
        // Show celebration modal
        this.celebrationModal.style.display = 'flex';
        
        // Add some extra celebration effects
        this.startCelebrationEffects();
    }
    
    determineOverallWinner() {
        const level1Winner = this.levelWinners.level1;
        const level2Winner = this.levelWinners.level2;
        const level3Winner = this.levelWinners.level3;
        
        // Count wins for each player
        let player1Wins = 0;
        let player2Wins = 0;
        
        if (level1Winner === 'Player 1') player1Wins++;
        if (level1Winner === 'Player 2') player2Wins++;
        if (level2Winner === 'Player 1') player1Wins++;
        if (level2Winner === 'Player 2') player2Wins++;
        if (level3Winner === 'Player 1') player1Wins++;
        if (level3Winner === 'Player 2') player2Wins++;
        
        if (player1Wins > player2Wins) {
            return 'Player 1';
        } else if (player2Wins > player1Wins) {
            return 'Player 2';
        } else {
            return 'Both Players (Tie)';
        }
    }
    
    startCelebrationEffects() {
        // Add confetti effect or other celebration animations
        console.log('🎉 Celebration started! 🎉');
        
        // You could add more celebration effects here
        // like confetti, sound effects, etc.
    }
    
    updateLevelTimesDisplay() {
        console.log('Updating level times display...');
        console.log('Level times data:', this.levelTimes);
        
        // Update Level 1 times
        if (this.levelTimes.level1.player1 !== null) {
            const time1 = this.formatTime(this.levelTimes.level1.player1);
            document.getElementById('level1Player1').textContent = time1;
            console.log('Level 1 Player 1 time:', time1);
        }
        if (this.levelTimes.level1.player2 !== null) {
            const time2 = this.formatTime(this.levelTimes.level1.player2);
            document.getElementById('level1Player2').textContent = time2;
            console.log('Level 1 Player 2 time:', time2);
        }
        
        // Update Level 2 times
        if (this.levelTimes.level2.player1 !== null) {
            const time1 = this.formatTime(this.levelTimes.level2.player1);
            document.getElementById('level2Player1').textContent = time1;
            console.log('Level 2 Player 1 time:', time1);
        }
        if (this.levelTimes.level2.player2 !== null) {
            const time2 = this.formatTime(this.levelTimes.level2.player2);
            document.getElementById('level2Player2').textContent = time2;
            console.log('Level 2 Player 2 time:', time2);
        }
        
        // Update Level 3 times
        if (this.levelTimes.level3.player1 !== null) {
            const time1 = this.formatTime(this.levelTimes.level3.player1);
            document.getElementById('level3Player1').textContent = time1;
            console.log('Level 3 Player 1 time:', time1);
        }
        if (this.levelTimes.level3.player2 !== null) {
            const time2 = this.formatTime(this.levelTimes.level3.player2);
            document.getElementById('level3Player2').textContent = time2;
            console.log('Level 3 Player 2 time:', time2);
        }
        
        console.log('Level times display updated!');
    }
    
    restartFromBeginning() {
        // Hide celebration modal
        this.celebrationModal.style.display = 'none';
        
        // Reset everything to start over
        this.currentLevel = 1;
        this.currentGame = 1;
        this.levelComplete = false;
        this.previewPhaseActive = false;
        
        // Reset level winners
        this.levelWinners = {
            level1: null,
            level2: null,
            level3: null
        };
        
        // Reset level times
        this.levelTimes = {
            level1: { player1: null, player2: null },
            level2: { player1: null, player2: null },
            level3: { player1: null, player2: null }
        };
        
        // Reset scores
        Object.keys(this.players).forEach(playerKey => {
            this.players[playerKey].score = 0;
        });
        
        this.updateUI();
        
        // Reset player states
        Object.keys(this.players).forEach(playerKey => {
            const player = this.players[playerKey];
            player.flippedCards = [];
            player.matchedPairs = 0;
            player.startTime = null;
            player.endTime = null;
            player.isPlaying = false;
            player.isComplete = false;
            player.status.textContent = 'Ready to play!';
            
            // Stop timer
            this.stopTimer(playerKey);
            player.timer.textContent = '00:00';
        });
        
        // Clear any stuck cards
        document.querySelectorAll('.card').forEach(card => {
            card.classList.remove('flipped', 'matched');
        });
        
        // Recreate boards
        this.createBoards();
    }
    
    showGameOver() {
        // Legacy method - now handled by determineGameWinner
        this.determineGameWinner();
    }
    
    resetGame() {
        // Hide modals
        this.gameOverModal.style.display = 'none';
        this.celebrationModal.style.display = 'none';
        
        // If level is complete, progress to next level or show celebration
        if (this.levelComplete) {
            console.log(`Level ${this.currentLevel} was complete, progressing...`);
            if (this.currentLevel === 1) {
                // Progress to Level 2
                this.currentLevel = 2;
                this.currentGame = 1;
                this.levelComplete = false;
                console.log('Progressed to Level 2!');
                
                // Reset scores for Level 2
                Object.keys(this.players).forEach(playerKey => {
                    this.players[playerKey].score = 0;
                });
                
                this.updateUI();
                
                // Reset player states for new game
                Object.keys(this.players).forEach(playerKey => {
                    const player = this.players[playerKey];
                    player.flippedCards = [];
                    player.matchedPairs = 0;
                    player.startTime = null;
                    player.endTime = null;
                    player.isPlaying = false;
                    player.isComplete = false;
                    player.status.textContent = 'Ready to play!';
                    
                    // Stop timer
                    this.stopTimer(playerKey);
                    player.timer.textContent = '00:00';
                });
                
                // Clear any stuck cards
                document.querySelectorAll('.card').forEach(card => {
                    card.classList.remove('flipped', 'matched');
                });
                
                // Recreate boards first, then start preview phase
                this.createBoards();
                
                // Start preview phase for Level 2/3 after boards are created
                setTimeout(() => {
                    this.startPreviewPhase();
                }, 100); // Small delay to ensure boards are rendered
                
                return; // Exit early since we handled Level 2 setup
            } else if (this.currentLevel === 2) {
                // Progress to Level 3
                this.currentLevel = 3;
                this.currentGame = 1;
                this.levelComplete = false;
                console.log('Progressed to Level 3!');
                
                // Reset scores for Level 3
                Object.keys(this.players).forEach(playerKey => {
                    this.players[playerKey].score = 0;
                });
                
                this.updateUI();
                
                // Reset player states for new game
                Object.keys(this.players).forEach(playerKey => {
                    const player = this.players[playerKey];
                    player.flippedCards = [];
                    player.matchedPairs = 0;
                    player.startTime = null;
                    player.endTime = null;
                    player.isPlaying = false;
                    player.isComplete = false;
                    player.status.textContent = 'Ready to play!';
                    
                    // Stop timer
                    this.stopTimer(playerKey);
                    player.timer.textContent = '00:00';
                });
                
                // Clear any stuck cards
                document.querySelectorAll('.card').forEach(card => {
                    card.classList.remove('flipped', 'matched');
                });
                
                // Recreate boards first, then start preview phase
                this.createBoards();
                
                // Start preview phase for Level 2/3 after boards are created
                setTimeout(() => {
                    this.startPreviewPhase();
                }, 100); // Small delay to ensure boards are rendered
                
                return; // Exit early since we handled Level 3 setup
            } else {
                // Level 3 complete - show celebration!
                console.log('All levels complete! Showing celebration...');
                this.showCelebration();
                return; // Don't reset the game yet
            }
        }
        
        this.updateUI();
        
        // Reset player states for new game
        Object.keys(this.players).forEach(playerKey => {
            const player = this.players[playerKey];
            player.flippedCards = [];
            player.matchedPairs = 0;
            player.startTime = null;
            player.endTime = null;
            player.isPlaying = false;
            player.isComplete = false;
            player.status.textContent = 'Ready to play!';
            
            // Stop timer
            this.stopTimer(playerKey);
            player.timer.textContent = '00:00';
        });
        
        // Clear any stuck cards
        document.querySelectorAll('.card').forEach(card => {
            card.classList.remove('flipped', 'matched');
        });
        
        // Recreate boards
        this.createBoards();
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game...');
    console.log('All buttons found:', {
        resetBtn: document.getElementById('resetBtn'),
        testLevel2Btn: document.getElementById('testLevel2Btn'),
        testLevel3Btn: document.getElementById('testLevel3Btn')
    });
    
    // Test if Level 3 button exists
    const testLevel3Btn = document.getElementById('testLevel3Btn');
    if (testLevel3Btn) {
        console.log('Level 3 button found in DOM');
    } else {
        console.error('Level 3 button NOT found in DOM!');
    }
    
    new MemoryGame();
}); 