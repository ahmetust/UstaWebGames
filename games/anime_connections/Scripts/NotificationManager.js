// NotificationManager.js - Bildirim ve modal yönetimi
import { MODE_TEXTS } from './GameConfig.js';

export class NotificationManager {
  static showWarning(title, text, timer = 1200) {
    return Swal.fire({
      icon: 'warning',
      title,
      text,
      showConfirmButton: false,
      timer
    });
  }

  static showSuccess(title, text, timer = 1200) {
    return Swal.fire({
      icon: 'success',
      title,
      text,
      showConfirmButton: false,
      timer
    });
  }

  static showError(title, text, timer = 1200) {
    return Swal.fire({
      icon: 'error',
      title,
      text,
      showConfirmButton: false,
      timer
    });
  }

  static async showModeChangeConfirmation() {
    const result = await Swal.fire({
      icon: 'question',
      title: 'Mode Changed',
      text: 'The game is still ongoing. Do you want to start a new game?',
      showCancelButton: true,
      confirmButtonText: 'Yes, New game',
      cancelButtonText: 'No'
    });
    return result.isConfirmed;
  }

  static async showGameComplete(gameState) {
    const score = gameState.calculateScore();
    const elapsedTime = gameState.getElapsedTime();
    const modeText = MODE_TEXTS[gameState.currentGameMode] || MODE_TEXTS.normal;

    const result = await Swal.fire({
      icon: 'success',
      title: 'Congratulations! You Finished the Game! 🎉',
      html: `
        <div style="text-align: center; margin: 1rem 0;">
          <p><strong>Mode:</strong> ${modeText}</p>
          <p><strong>Your Score:</strong> ${score}</p>
          <p><strong>Time:</strong> ${elapsedTime} seconds</p>
          <p><strong>Number of Mistakes:</strong> ${gameState.mistakeCount}</p>
        </div>
      `,
      confirmButtonText: 'New Game'
    });
    return result.isConfirmed;
  }

  static async showGameOver(gameState, answersHTML) {
    const modeText = MODE_TEXTS[gameState.currentGameMode] || MODE_TEXTS.normal;
    
    const result = await Swal.fire({
      icon: 'error',
      title: 'Game Over',
      html: `
        <div style="margin-bottom: 1rem;">
          <p><strong>Mode:</strong> ${modeText}</p>
          <p>You made 5 mistakes. All answers are shown below.</p>
        </div>
        <div style="max-height:350px; overflow:auto; margin-bottom:1em;">
          ${answersHTML}
        </div>
      `,
      confirmButtonText: 'Restart',
      width: '650px'
    });
    return result.isConfirmed;
  }

  static showApiError() {
    return Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'An error occurred while loading characters. Please try again.',
      confirmButtonText: 'OK'
    });
  }

  static showCardLimitWarning() {
    return this.showWarning('Warning', 'You can select up to 4 cards!');
  }

  static showCorrectGuess() {
    return this.showSuccess('Congratulations!', 'You found the correct group 🎉');
  }

  static showWrongGuess(isThreeOfOneKind = false) {
    if (isThreeOfOneKind) {
      return this.showError(
        'Wrong Guess',
        'You selected 3 cards from the same group but 1 card from a different group'
      );
    }
    return this.showError('Wrong Guess', 'Incorrect grouping');
  }
}