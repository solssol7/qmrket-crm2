export const exportToCSV = (data, filename) => {
  if (!window.Papa) {
    throw new Error('Papa Parse 라이브러리가 로드되지 않았습니다');
  }

  const csv = window.Papa.unparse(data);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};
