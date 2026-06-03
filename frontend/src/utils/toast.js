import toast from 'react-hot-toast'

const baseStyle = {
  borderRadius: '12px',
  padding: '12px 16px',
  fontSize: '14px',
  fontWeight: '500',
  maxWidth: '400px',
}

export const showToast = {
  success: (message) => {
    toast.success(message, {
      style: {
        ...baseStyle,
        background: '#306D29',  // Forest green
        color: '#fff',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#306D29',
      },
      duration: 3000,
    })
  },

  error: (message) => {
    toast.error(message, {
      style: {
        ...baseStyle,
        background: '#BA1A1A',  // Error red
        color: '#fff',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#BA1A1A',
      },
      duration: 4000,
    })
  },

  info: (message) => {
    toast(message, {
      icon: 'ℹ️',
      style: {
        ...baseStyle,
        background: '#0D530E',  // Deep forest green
        color: '#fff',
      },
      duration: 3000,
    })
  },

  loading: (message) => {
    return toast.loading(message, {
      style: {
        ...baseStyle,
        background: '#4A4A2A',  // Dark olive
        color: '#fff',
      },
    })
  },

  dismiss: (toastId) => {
    toast.dismiss(toastId)
  },

  promise: (promise, messages) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading || 'Loading...',
        success: messages.success || 'Success!',
        error: messages.error || 'Something went wrong',
      },
      {
        style: baseStyle,
        success: {
          duration: 3000,
          style: {
            background: '#306D29',  // Forest green
            color: '#fff',
          },
        },
        error: {
          duration: 4000,
          style: {
            background: '#BA1A1A',  // Error red
            color: '#fff',
          },
        },
      }
    )
  },
}
