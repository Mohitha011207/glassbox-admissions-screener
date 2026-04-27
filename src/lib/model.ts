import { ModelWeights } from '../types';

export class LogisticRegression {
  weights: number[] = [];
  intercept: number = 0;
  featureNames: string[] = [];

  constructor(featureNames: string[]) {
    this.featureNames = featureNames;
    this.weights = new Array(featureNames.length).fill(0);
    this.intercept = 0;
  }

  sigmoid(z: number): number {
    return 1 / (1 + Math.exp(-z));
  }

  fit(X: number[][], y: number[], learningRate: number = 0.1, epochs: number = 1000, lambda: number = 0.1) {
    const m = X.length;
    const n = this.weights.length;

    for (let epoch = 0; epoch < epochs; epoch++) {
      let d_intercept = 0;
      let d_weights = new Array(n).fill(0);

      for (let i = 0; i < m; i++) {
        let z = this.intercept;
        for (let j = 0; j < n; j++) {
          z += X[i][j] * this.weights[j];
        }
        
        const h = this.sigmoid(z);
        const error = h - y[i];

        d_intercept += error;
        for (let j = 0; j < n; j++) {
          // Gradient with L2 regularization
          d_weights[j] += error * X[i][j] + (lambda * this.weights[j]);
        }
      }

      this.intercept -= (learningRate * d_intercept) / m;
      for (let j = 0; j < n; j++) {
        this.weights[j] -= (learningRate * d_weights[j]) / m;
      }
      
      // Early exit if gradients are tiny
      if (Math.abs(d_intercept) / m < 0.0001 && d_weights.every(w => Math.abs(w) / m < 0.0001)) {
          break;
      }
    }

    const coefficients: Record<string, number> = {};
    this.featureNames.forEach((name, i) => {
      coefficients[name] = this.weights[i];
    });

    return {
      coefficients,
      intercept: this.intercept
    };
  }

  predictProba(X_scaled: number[]): number {
    let z = this.intercept;
    for (let j = 0; j < this.weights.length; j++) {
      z += X_scaled[j] * this.weights[j];
    }
    // Calibration: sigmoid + slight clipping to avoid extreme 0/1 if that's desired
    // But L2 regularization usually handles this naturally.
    const p = this.sigmoid(z);
    return Math.max(0.01, Math.min(0.99, p)); 
  }

  predict(X_scaled: number[]): number {
    return this.predictProba(X_scaled) >= 0.5 ? 1 : 0;
  }
}
