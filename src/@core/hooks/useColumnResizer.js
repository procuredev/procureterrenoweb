import { useState, useEffect, useRef } from 'react';

const useColumnResizer = (loading) => {

  const [minWidths, setMinWidths] = useState({})
  const isResizing = useRef(-1);
  const separatorRef = useRef(null);

  const DEFAULT_MIN_WIDTH_CELL = 70;
  const DEFAULT_MAX_WIDTH_CELL = 800;

  const adjustWidthColumn = (index, width) => {
    const minWidth = DEFAULT_MIN_WIDTH_CELL;
    const maxWidth = DEFAULT_MAX_WIDTH_CELL;

    let newWidth =
      width > maxWidth ? maxWidth : width < minWidth ? minWidth : width;

    const columnElements = document.querySelectorAll(`[aria-colindex="${index}"]`);

    columnElements.forEach((element) => {
      element.style.maxWidth = "none";
      element.style.minWidth = "none";
      element.style.width = newWidth + 'px';
    });

    setMinWidths({...minWidths, [`.colIndex-${index}`]: {minWidth: `${newWidth}px !important`}});


  return adjustWidthColumn;
}


const handleMiDivClick = (event) => {
  separatorRef.current = event.srcElement.parentElement.parentNode.parentElement
  const index = event.srcElement.parentElement.parentNode.parentElement.attributes[3] ? event.srcElement.parentElement.parentNode.parentElement.attributes[3].nodeValue : 0
  isResizing.current = index;
  setCursorDocument(true);
};

const handleMouseMove = (event) => {
  if (isResizing.current >= 0) {
    const width =  event.clientX - separatorRef.current.getBoundingClientRect().left;
    adjustWidthColumn(isResizing.current, width);
  }

};

const saveColumnWidthsLocalStorage = (columnWidths) => {
  const columnWidthsString = JSON.stringify(columnWidths);
  localStorage.setItem('columnWidths', columnWidthsString);
};

const getColumnWidths = () => {
  console.log('getColumnWidths')
  const columnWidths = {};
  const columns = document.querySelectorAll('.MuiDataGrid-columnHeader');
  columns.forEach((column) => {
    const index = column.attributes[3].nodeValue;
    const width = column.getBoundingClientRect().width;
    columnWidths[`.colIndex-${index}`] = {minWidth: `${width}px !important`}
  });

  return columnWidths;
};

const handleMouseUp = (event) => {
  if (isResizing.current >= 0) {
    const columnWidths = getColumnWidths();
    console.log('handleMouseUp')
    setMinWidths(columnWidths);
    saveColumnWidthsLocalStorage(columnWidths);
  }
  isResizing.current = -1;
  separatorRef.current = null;
  setCursorDocument(false);
};

const setCursorDocument = (isResizing) => {
  document.body.style.cursor = isResizing ? "col-resize" : "auto";
};

useEffect(() => {
  if (!loading) {
    const miDivs = document.querySelectorAll('.MuiDataGrid-columnSeparator path')

    if (miDivs) {
      miDivs.forEach((div) => {
        div.addEventListener('mousedown', handleMiDivClick);
      });
    }
  }


  return () => {
    const miDivs = document.querySelectorAll('.MuiDataGrid-columnSeparator path');
    miDivs.forEach((div) => {
      div.removeEventListener('click', handleMiDivClick);
    });}

}, [loading]);

useEffect(() => {
  document.onmousemove = handleMouseMove
  document.onmouseup = handleMouseUp

  return () => {
    document.onmousemove = null;
    document.onmouseup = null;
  };
}, []);

useEffect(() => {
  const columnWidthsString = localStorage.getItem('columnWidths');
  const columnWidths = JSON.parse(columnWidthsString);
  if (columnWidths) {
    console.log('from local storage')
    setMinWidths(columnWidths);
  } else {
    console.log('from default')
    setMinWidths({...minWidths,
      '.colIndex-1': {minWidth: '200px !important'},
      '.colIndex-7': {minWidth: '70px !important'}
    }
      )
  }
}, []);

return minWidths;

}

export default useColumnResizer;
