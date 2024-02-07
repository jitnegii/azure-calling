
export class Timer {
    private intervalId: NodeJS.Timeout | null = null;
    private callback: (duration:number) => void;
    private totalDuration: number = 0;
  
    constructor(callback: (duration:number) => void) {
      this.callback = callback;
    }
  
    start(): void {
      if (this.intervalId === null) {
        this.totalDuration = 0;
        this.intervalId = setInterval(() => {
          this.totalDuration++;
          this.callback(this.totalDuration);
        }, 1000); //  1 second
        console.log('Timer started.');
      } else {
        console.log('Timer is already running.');
      }
    }
  
    stop(): void {
      if (this.intervalId !== null) {
        clearInterval(this.intervalId);
        this.intervalId = null;
        console.log('Timer stopped. Total duration:', this.totalDuration, 'seconds');
      } else {
        console.log('Timer is not running.');
      }
      this.totalDuration = 0
      this.callback(this.totalDuration);
    }
  
   

  }