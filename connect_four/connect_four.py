import pygame
import numpy as np
import sys
import time
from typing import Tuple, Optional
from datetime import timedelta

# Constants
BLUE = (65, 105, 225)  # Royal Blue
BLACK = (0, 0, 0)
RED = (220, 20, 60)    # Crimson Red
YELLOW = (255, 223, 0) # Deep Yellow
WHITE = (255, 255, 255)
LIGHT_GRAY = (240, 240, 240)  # Background color

SQUARESIZE = 100
RADIUS = int(SQUARESIZE/2 - 5)

# Button dimensions
BUTTON_WIDTH = 250
BUTTON_HEIGHT = 80

# Board dimensions
ROWS = 6
COLS = 7

# Calculate window size
width = COLS * SQUARESIZE
height = (ROWS + 1) * SQUARESIZE  # Extra row for piece dropping animation
size = (width, height)

class ConnectFour:
    def __init__(self, vs_ai=False):
        self.board = np.zeros((ROWS, COLS))
        self.game_over = False
        self.turn = 1  # 1 for Player 1 (RED), 2 for Player 2/AI (YELLOW)
        self.vs_ai = vs_ai
        self.winning_pieces = []  # Will store coordinates of winning pieces
    
    def get_valid_moves(self):
        """Returns list of valid column numbers where pieces can be dropped."""
        return [col for col in range(COLS) if self.is_valid_location(col)]
    
    def evaluate_window(self, window):
        """Score a window of 4 positions."""
        score = 0
        player_pieces = np.sum(window == 1)
        ai_pieces = np.sum(window == 2)
        empty = np.sum(window == 0)

        if ai_pieces == 4:
            score += 100
        elif ai_pieces == 3 and empty == 1:
            score += 5
        elif ai_pieces == 2 and empty == 2:
            score += 2

        if player_pieces == 3 and empty == 1:
            score -= 4

        return score

    def score_position(self):
        """Score the entire board position."""
        score = 0

        # Score center column
        center_array = self.board[:, COLS//2]
        center_count = np.sum(center_array == 2)
        score += center_count * 3

        # Score horizontal
        for r in range(ROWS):
            row_array = self.board[r, :]
            for c in range(COLS-3):
                window = row_array[c:c+4]
                score += self.evaluate_window(window)

        # Score vertical
        for c in range(COLS):
            col_array = self.board[:, c]
            for r in range(ROWS-3):
                window = col_array[r:r+4]
                score += self.evaluate_window(window)

        # Score diagonal
        for r in range(ROWS-3):
            for c in range(COLS-3):
                # Positive slope
                window = [self.board[r+i][c+i] for i in range(4)]
                score += self.evaluate_window(window)
                # Negative slope
                window = [self.board[r+3-i][c+i] for i in range(4)]
                score += self.evaluate_window(window)

        return score

    def is_terminal_node(self):
        """Check if the game is over."""
        return self.check_win() or len(self.get_valid_moves()) == 0

    def minimax(self, depth, alpha, beta, maximizing_player):
        """Minimax algorithm with alpha-beta pruning."""
        valid_moves = self.get_valid_moves()
        is_terminal = self.is_terminal_node()
        
        if depth == 0 or is_terminal:
            if is_terminal:
                if self.check_win() and self.turn == 2:  # AI wins
                    return (None, 100000000000000)
                elif self.check_win() and self.turn == 1:  # Player wins
                    return (None, -10000000000000)
                else:  # Game is over, no more valid moves
                    return (None, 0)
            else:  # Depth is zero
                return (None, self.score_position())
        
        if maximizing_player:
            value = float('-inf')
            column = valid_moves[0]
            for col in valid_moves:
                row = next(r for r in range(ROWS-1, -1, -1) if self.board[r][col] == 0)
                self.board[row][col] = 2
                self.turn = 1
                new_score = self.minimax(depth-1, alpha, beta, False)[1]
                self.board[row][col] = 0
                self.turn = 2
                if new_score > value:
                    value = new_score
                    column = col
                alpha = max(alpha, value)
                if alpha >= beta:
                    break
            return column, value
        
        else:  # Minimizing player
            value = float('inf')
            column = valid_moves[0]
            for col in valid_moves:
                row = next(r for r in range(ROWS-1, -1, -1) if self.board[r][col] == 0)
                self.board[row][col] = 1
                self.turn = 2
                new_score = self.minimax(depth-1, alpha, beta, True)[1]
                self.board[row][col] = 0
                self.turn = 1
                if new_score < value:
                    value = new_score
                    column = col
                beta = min(beta, value)
                if alpha >= beta:
                    break
            return column, value

    def get_ai_move(self):
        """Get the best move for AI using minimax algorithm."""
        col, _ = self.minimax(5, float('-inf'), float('inf'), True)
        return col
    
    def drop_piece(self, col: int) -> bool:
        """Attempts to drop a piece in the specified column.
        Returns True if successful, False if column is full."""
        for row in range(ROWS-1, -1, -1):
            if self.board[row][col] == 0:
                self.board[row][col] = self.turn
                return True
        return False
    
    def is_valid_location(self, col: int) -> bool:
        """Check if a piece can be dropped in the specified column."""
        return self.board[0][col] == 0
    
    def check_win(self) -> bool:
        """Check if the current player has won and store winning pieces."""
        # Check horizontal
        for r in range(ROWS):
            for c in range(COLS-3):
                if (self.board[r][c] == self.turn and
                    self.board[r][c+1] == self.turn and
                    self.board[r][c+2] == self.turn and
                    self.board[r][c+3] == self.turn):
                    self.winning_pieces = [(r, c), (r, c+1), (r, c+2), (r, c+3)]
                    return True

        # Check vertical
        for r in range(ROWS-3):
            for c in range(COLS):
                if (self.board[r][c] == self.turn and
                    self.board[r+1][c] == self.turn and
                    self.board[r+2][c] == self.turn and
                    self.board[r+3][c] == self.turn):
                    self.winning_pieces = [(r, c), (r+1, c), (r+2, c), (r+3, c)]
                    return True

        # Check diagonal (positive slope)
        for r in range(ROWS-3):
            for c in range(COLS-3):
                if (self.board[r][c] == self.turn and
                    self.board[r+1][c+1] == self.turn and
                    self.board[r+2][c+2] == self.turn and
                    self.board[r+3][c+3] == self.turn):
                    self.winning_pieces = [(r, c), (r+1, c+1), (r+2, c+2), (r+3, c+3)]
                    return True

        # Check diagonal (negative slope)
        for r in range(3, ROWS):
            for c in range(COLS-3):
                if (self.board[r][c] == self.turn and
                    self.board[r-1][c+1] == self.turn and
                    self.board[r-2][c+2] == self.turn and
                    self.board[r-3][c+3] == self.turn):
                    self.winning_pieces = [(r, c), (r-1, c+1), (r-2, c+2), (r-3, c+3)]
                    return True

        return False

    def draw_board(self, flash_winners=False):
        """Draw the game board."""
        screen = pygame.display.get_surface()
        # Draw the blue board
        pygame.draw.rect(screen, BLUE, (0, SQUARESIZE, width, height))
        
        # Draw the circles for each position
        for c in range(COLS):
            for r in range(ROWS):
                pygame.draw.circle(screen, BLACK,
                                 (int(c*SQUARESIZE + SQUARESIZE/2),
                                  height - int((ROWS-r)*SQUARESIZE - SQUARESIZE/2)),
                                 RADIUS)
        
        # Draw the pieces
        for c in range(COLS):
            for r in range(ROWS):
                if self.board[r][c] == 0:
                    continue
                
                # Determine piece color
                base_color = RED if self.board[r][c] == 1 else YELLOW
                
                # Check if this piece is part of the winning four
                is_winner = (r, c) in self.winning_pieces
                
                # If it's a winning piece and we should flash, use white, otherwise use base color
                color = WHITE if (is_winner and flash_winners) else base_color
                
                center_x = int(c*SQUARESIZE + SQUARESIZE/2)
                center_y = height - int((ROWS-r)*SQUARESIZE - SQUARESIZE/2)
                
                # Draw piece
                pygame.draw.circle(screen, color, (center_x, center_y), RADIUS)
                
                # Draw highlight effect for winning pieces
                if is_winner:
                    pygame.draw.circle(screen, (255, 255, 255), (center_x, center_y), RADIUS, 3)
        
        # Draw line through winning pieces if game is over
        if self.game_over and len(self.winning_pieces) == 4:
            start_r, start_c = self.winning_pieces[0]
            end_r, end_c = self.winning_pieces[3]
            
            start_x = int(start_c * SQUARESIZE + SQUARESIZE/2)
            start_y = height - int((ROWS-start_r)*SQUARESIZE - SQUARESIZE/2)
            end_x = int(end_c * SQUARESIZE + SQUARESIZE/2)
            end_y = height - int((ROWS-end_r)*SQUARESIZE - SQUARESIZE/2)
            
            # Draw thick line through winning pieces
            pygame.draw.line(screen, WHITE, (start_x, start_y), (end_x, end_y), 8)
        
        pygame.display.update()

def draw_button(text, x, y, w, h, color, hover_color, mouse_pos):
    screen = pygame.display.get_surface()
    button_rect = pygame.Rect(x, y, w, h)
    is_hovered = button_rect.collidepoint(mouse_pos)
    
    # Draw button shadow
    shadow_rect = pygame.Rect(x + 4, y + 4, w, h)
    pygame.draw.rect(screen, (100, 100, 100), shadow_rect, border_radius=10)
    
    # Draw main button
    pygame.draw.rect(screen, hover_color if is_hovered else color, button_rect, border_radius=10)
    
    font = pygame.font.SysFont("monospace", 42, bold=True)
    text_surface = font.render(text, True, WHITE)
    text_rect = text_surface.get_rect(center=button_rect.center)
    screen.blit(text_surface, text_rect)
    
    return button_rect

def show_winner_screen(winner_text, game_time):
    screen = pygame.display.get_surface()
    
    # Draw semi-transparent overlay at the top only
    overlay = pygame.Surface((width, SQUARESIZE))
    overlay.fill(WHITE)
    overlay.set_alpha(240)
    screen.blit(overlay, (0, 0))
    
    # Draw winner text
    font = pygame.font.SysFont("monospace", 60, bold=True)
    winner_color = RED if "1" in winner_text else YELLOW
    text_surface = font.render(winner_text, True, winner_color)
    text_rect = text_surface.get_rect(center=(width/2, SQUARESIZE/2))
    screen.blit(text_surface, text_rect)
    
    pygame.display.update()

def show_end_menu(winner_text, game_time, mouse_pos):
    screen = pygame.display.get_surface()
    # Draw semi-transparent overlay
    overlay = pygame.Surface((width, height))
    overlay.fill(WHITE)
    overlay.set_alpha(240)
    screen.blit(overlay, (0, 0))
    
    # Draw winner text
    font = pygame.font.SysFont("monospace", 60, bold=True)
    winner_color = RED if "1" in winner_text else YELLOW
    text_surface = font.render(winner_text, True, winner_color)
    text_rect = text_surface.get_rect(center=(width/2, height/3 - 50))
    screen.blit(text_surface, text_rect)
    
    # Draw game time
    time_font = pygame.font.SysFont("monospace", 40)
    time_text = time_font.render(f"Game Time: {game_time}", True, BLACK)
    time_rect = time_text.get_rect(center=(width/2, height/3 + 30))
    screen.blit(time_text, time_rect)
    
    # Draw "Continue" button
    button_y = height/2 + 30
    continue_rect = draw_button("Continue", width/2 - BUTTON_WIDTH/2, button_y, 
                             BUTTON_WIDTH, BUTTON_HEIGHT, BLUE, (0, 150, 255), mouse_pos)
    
    pygame.display.update()
    return continue_rect

def format_time(seconds):
    """Convert seconds to a formatted string of hours:minutes:seconds"""
    return str(timedelta(seconds=int(seconds)))

def draw_main_menu(mouse_pos, total_play_time):
    screen = pygame.display.get_surface()
    screen.fill(LIGHT_GRAY)
    
    # Title
    title_font = pygame.font.SysFont("monospace", 80, bold=True)
    title = title_font.render("Connect Four", True, BLUE)
    title_rect = title.get_rect(center=(width/2, height/4))
    screen.blit(title, title_rect)
    
    # Total play time
    time_font = pygame.font.SysFont("monospace", 36)
    time_text = time_font.render(f"Total Play Time: {format_time(total_play_time)}", True, BLACK)
    time_rect = time_text.get_rect(center=(width/2, height/2 - 50))
    screen.blit(time_text, time_rect)
    
    # Buttons
    button_y = height/2 + 50
    spacing = 80
    
    two_player_rect = draw_button("2 Players", width/2 - BUTTON_WIDTH - spacing/2, button_y, 
                          BUTTON_WIDTH, BUTTON_HEIGHT, BLUE, (0, 150, 255), mouse_pos)
    
    vs_ai_rect = draw_button("VS AI", width/2 + spacing/2, button_y, 
                         BUTTON_WIDTH, BUTTON_HEIGHT, (75, 0, 130), (100, 0, 180), mouse_pos)
    
    # Exit button at bottom
    exit_rect = draw_button("Exit Game", width/2 - BUTTON_WIDTH/2, button_y + BUTTON_HEIGHT + 30, 
                         BUTTON_WIDTH, BUTTON_HEIGHT, RED, (255, 100, 100), mouse_pos)
    
    pygame.display.update()
    return two_player_rect, vs_ai_rect, exit_rect

def main():
    # Initialize Pygame
    pygame.init()
    screen = pygame.display.set_mode(size)
    pygame.display.set_caption('Connect Four')
    
    running = True
    total_play_time = 0  # Track total time across all games
    in_main_menu = True
    
    while running:
        if in_main_menu:
            mouse_pos = pygame.mouse.get_pos()
            two_player_rect, vs_ai_rect, exit_rect = draw_main_menu(mouse_pos, total_play_time)
            
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                
                if event.type == pygame.MOUSEBUTTONDOWN:
                    if two_player_rect.collidepoint(event.pos):
                        in_main_menu = False
                        vs_ai_mode = False
                    elif vs_ai_rect.collidepoint(event.pos):
                        in_main_menu = False
                        vs_ai_mode = True
                    elif exit_rect.collidepoint(event.pos):
                        running = False
            continue  # Skip the game loop while in main menu
        
        # Start new game
        game = ConnectFour(vs_ai=vs_ai_mode)
        game.draw_board()
        font = pygame.font.SysFont("monospace", 75)
        game_start_time = time.time()
        
        # Game loop
        while not game.game_over and running:
            mouse_pos = pygame.mouse.get_pos()
            
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                    break

                if event.type == pygame.MOUSEMOTION and not game.game_over:
                    # Clear the top row (where we show the moving piece)
                    pygame.draw.rect(screen, BLACK, (0, 0, width, SQUARESIZE))
                    posx = event.pos[0]
                    if game.turn == 1:
                        pygame.draw.circle(screen, RED, (posx, int(SQUARESIZE/2)), RADIUS)
                    else:
                        pygame.draw.circle(screen, YELLOW, (posx, int(SQUARESIZE/2)), RADIUS)
                    pygame.display.update()

                if event.type == pygame.MOUSEBUTTONDOWN and not game.game_over:
                    # Clear the top row
                    pygame.draw.rect(screen, BLACK, (0, 0, width, SQUARESIZE))
                    
                    # Get player move
                    posx = event.pos[0]
                    col = int(posx // SQUARESIZE)
                    
                    if col >= 0 and col < COLS and game.is_valid_location(col):
                        if game.drop_piece(col):
                            if game.check_win():
                                game.game_over = True
                                # Add the game duration to total play time
                                game_duration = time.time() - game_start_time
                                total_play_time += game_duration
                                
                                # Flash winning pieces animation
                                for _ in range(6):  # Flash 3 times
                                    game.draw_board(flash_winners=True)
                                    pygame.time.wait(200)
                                    game.draw_board(flash_winners=False)
                                    pygame.time.wait(200)
                            
                            game.turn = 3 - game.turn  # Switch between 1 and 2
                            game.draw_board()
                            
                            # AI move if it's AI's turn
                            if game.vs_ai and game.turn == 2 and not game.game_over:
                                pygame.time.wait(500)  # Add a small delay for better UX
                                ai_col = game.get_ai_move()
                                if game.drop_piece(ai_col):
                                    if game.check_win():
                                        game.game_over = True
                                    game.turn = 3 - game.turn
                                    game.draw_board()
            
            if game.game_over:
                winner_text = f"Player {3 - game.turn} wins!"  # 3 - turn because we already switched turns
                current_time = format_time(time.time() - game_start_time)
                
                # First show the winner and winning pieces
                show_winner_screen(winner_text, current_time)
                pygame.time.wait(3000)  # Wait 3 seconds to show the winning move
                
                # Then show the end menu
                waiting_for_choice = True
                while waiting_for_choice and running:
                    mouse_pos = pygame.mouse.get_pos()
                    continue_rect = show_end_menu(winner_text, current_time, mouse_pos)
                    
                    for event in pygame.event.get():
                        if event.type == pygame.QUIT:
                            running = False
                            waiting_for_choice = False
                        
                        if event.type == pygame.MOUSEBUTTONDOWN:
                            if continue_rect.collidepoint(event.pos):
                                waiting_for_choice = False
                                in_main_menu = True  # Return to main menu
                                break

if __name__ == "__main__":
    main()
