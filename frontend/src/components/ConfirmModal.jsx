import { useState, useCallback } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

/**
 * Hook para usar o ConfirmModal de forma imperativa.
 * Retorna [confirm, ConfirmModalJSX]
 * 
 * Uso:
 *   const [confirm, ConfirmModal] = useConfirm();
 *   // no JSX: {ConfirmModal}
 *   // para abrir: await confirm({ title: 'Excluir?', message: '...' })
 */
export function useConfirm() {
  const [state, setState] = useState(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setState({ ...options, resolve });
    });
  }, []);

  const handleClose = (result) => {
    state?.resolve(result);
    setState(null);
  };

  const modal = state ? (
    <ConfirmModal
      title={state.title}
      message={state.message}
      confirmLabel={state.confirmLabel || 'Confirmar'}
      cancelLabel={state.cancelLabel || 'Cancelar'}
      variant={state.variant || 'danger'}
      onConfirm={() => handleClose(true)}
      onCancel={() => handleClose(false)}
    />
  ) : null;

  return [confirm, modal];
}

function ConfirmModal({ title, message, confirmLabel, cancelLabel, variant, onConfirm, onCancel }) {
  const variantConfig = {
    danger: {
      icon: <Trash2 size={28} className="text-red-500" />,
      iconBg: 'bg-red-50',
      btnClass: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      icon: <AlertTriangle size={28} className="text-amber-500" />,
      iconBg: 'bg-amber-50',
      btnClass: 'bg-amber-500 hover:bg-amber-600 text-white',
    },
    info: {
      icon: <AlertTriangle size={28} className="text-indigo-500" />,
      iconBg: 'bg-indigo-50',
      btnClass: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    },
  };

  const cfg = variantConfig[variant] || variantConfig.danger;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
        {/* Ícone */}
        <div className={`w-16 h-16 ${cfg.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-5`}>
          {cfg.icon}
        </div>

        {/* Conteúdo */}
        <div className="text-center mb-8">
          <h3 className="text-xl font-extrabold text-gray-900 mb-2 tracking-tight">{title}</h3>
          {message && <p className="text-gray-500 text-sm leading-relaxed">{message}</p>}
        </div>

        {/* Botões */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-5 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-[1.5] px-5 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 ${cfg.btnClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
