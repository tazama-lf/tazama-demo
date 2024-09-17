import React from 'react';

interface DebtorProps {
  textColor?: 'text-blue-800' | 'text-green-600' | 'text-yellow-400' | 'text-orange-600';
}

export const Debtor = ({
  textColor = 'text-blue-800'
}: DebtorProps) => {
  return (
    <div className={['mb-2', 'p-2', `${textColor}`].join(' ')}>
      <i className="fa-regular fa-pen-to-square fa-sm text-black"></i>
      <i className="fa-solid fa-user fa-2xl border rounded-md px-1 py-5"></i>

      <i className="fa-solid fa-file"></i>
      <i className="fa-solid fa-file"></i>

      <button data-modal-target="default-modal" data-modal-toggle="default-modal" className="fa-solid fa-circle-plus"></button>
      <i className="fa-solid fa-atom"></i>
    </div>
  );
}; 
