import { StudentData } from '../types';

export const generateSyntheticData = (count: number = 200): StudentData[] => {
  const data: StudentData[] = [];
  const names = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy', 'Kevin', 'Laura', 'Mallory', 'Niaj', 'Olivia', 'Peggy', 'Quentin', 'Rose', 'Steve', 'Trent'];
  const incomes: ('Low' | 'Medium' | 'High')[] = ['Low', 'Medium', 'High'];
  const genders: ('Male' | 'Female' | 'Other')[] = ['Male', 'Female', 'Other'];

  for (let i = 0; i < count; i++) {
    const gpa = parseFloat((Math.random() * (4.0 - 2.0) + 2.0).toFixed(2));
    const entranceScore = Math.floor(Math.random() * (1600 - 800) + 800);
    const projects = Math.floor(Math.random() * 6);
    const internships = Math.floor(Math.random() * 4);
    const income = incomes[Math.floor(Math.random() * incomes.length)];
    const gender = genders[Math.floor(Math.random() * genders.length)];
    const zipCode = Math.floor(Math.random() * 90000) + 10000;

    // Admissions logic (with some bias and randomness)
    let score = (gpa * 10) + (entranceScore / 100) + (projects * 2) + (internships * 3);
    if (income === 'Low') score -= 5; 
    
    const probability = 1 / (1 + Math.exp(-(score - 35) / 5));
    const admit = Math.random() < probability ? 1 : 0;

    data.push({
      Student_ID: `S${1000 + i}`,
      Student_Name: `${names[Math.floor(Math.random() * names.length)]} ${i}`,
      GPA: gpa,
      Entrance_Score: entranceScore,
      Projects: projects,
      Internships: internships,
      Income: income,
      Gender: gender,
      ZipCode: zipCode,
      Admit: admit,
    });
  }
  return data;
};

export const preprocessData = (data: StudentData[]) => {
  const potentialNumeric = ['GPA', 'Entrance_Score', 'Projects', 'Internships', 'ZipCode'];
  const potentialCategorical = ['Income', 'Income_Level', 'Gender'];
  
  if (data.length === 0) {
    return { X: [], y: [], featureNames: [], scaler: { mean: [], std: [] } };
  }

  const firstRow = data[0];
  const numericFeatures = potentialNumeric.filter(f => f in firstRow);
  const categoricalFeatures = potentialCategorical.filter(f => f in firstRow);

  if (numericFeatures.length === 0 && categoricalFeatures.length === 0) {
    console.error('No features found in data');
  }

  // Create dummies
  const featureNames: string[] = [...numericFeatures];
  const processedRows: number[][] = [];
  const targets: number[] = [];

  // Map to store unique categories for each categorical feature
  const categoriesMap: Record<string, string[]> = {};
  categoricalFeatures.forEach(feat => {
    categoriesMap[feat] = Array.from(new Set(data.map(d => String(d[feat])).filter(val => val && val !== 'undefined' && val !== 'null'))).sort();
    categoriesMap[feat].forEach(level => featureNames.push(`${feat}_${level}`));
  });

  data.forEach(row => {
    const processedRow: number[] = [];
    
    // Numeric
    numericFeatures.forEach(feat => {
      const val = parseFloat(String(row[feat]));
      processedRow.push(isNaN(val) ? 0 : val);
    });
    
    // Categorical (One-hot)
    categoricalFeatures.forEach(feat => {
      const rowVal = String(row[feat]);
      categoriesMap[feat].forEach(level => processedRow.push(rowVal === level ? 1 : 0));
    });

    processedRows.push(processedRow);
    targets.push(typeof row.Admit === 'number' ? row.Admit : (parseFloat(String(row.Admit)) || 0));
  });

  // Scaling - ONLY scale the numeric base features, not the dummies
  // This keeps dummies as 0/1 which is better for interpretation and avoids weird variance issues
  const nFeatures = featureNames.length;
  const means = new Array(nFeatures).fill(0);
  const stds = new Array(nFeatures).fill(1);

  if (processedRows.length > 0) {
    // Only calculate stats for numeric features (first numericFeatures.length columns)
    for (let j = 0; j < numericFeatures.length; j++) {
      let sum = 0;
      for (let i = 0; i < processedRows.length; i++) {
          sum += processedRows[i][j];
      }
      means[j] = sum / processedRows.length;

      let varianceSum = 0;
      for (let i = 0; i < processedRows.length; i++) {
          varianceSum += Math.pow(processedRows[i][j] - means[j], 2);
      }
      stds[j] = Math.sqrt(varianceSum / processedRows.length) || 1; 
    }
  }

  const scaledRows = processedRows.map(row => 
    row.map((val, j) => (j < numericFeatures.length) ? (val - means[j]) / stds[j] : val)
  );

  return {
    X: scaledRows,
    y: targets,
    featureNames,
    scaler: { mean: means, std: stds }
  };
};

export const trainTestSplit = <T, U>(X: T[], y: U[], testSize: number = 0.2) => {
  const n = X.length;
  const indices = Array.from({ length: n }, (_, i) => i);
  
  // Fisher-Yates shuffle
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const splitIndex = Math.floor(n * (1 - testSize));
  const trainIndices = indices.slice(0, splitIndex);
  const testIndices = indices.slice(splitIndex);

  return {
    X_train: trainIndices.map(i => X[i]),
    y_train: trainIndices.map(i => y[i]),
    X_test: testIndices.map(i => X[i]),
    y_test: testIndices.map(i => y[i])
  };
};

export const extractFeatures = (row: StudentData, featureNames: string[]): number[] => {
  return featureNames.map(name => {
    // Check if it's a numeric base feature
    if (['GPA', 'Entrance_Score', 'Projects', 'Internships', 'ZipCode'].includes(name)) {
      const val = parseFloat(String(row[name]));
      return isNaN(val) ? 0 : val;
    }
    
    // Check if it's a categorical dummy
    const prefixes = ['Income_', 'Income_Level_', 'Gender_'];
    for (const prefix of prefixes) {
      if (name.startsWith(prefix)) {
        const featName = prefix.slice(0, -1); // 'Income', 'Income_Level', 'Gender'
        const level = name.replace(prefix, '');
        return String(row[featName]) === level ? 1 : 0;
      }
    }
    
    return 0;
  });
};
