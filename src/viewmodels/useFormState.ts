import { useState, useCallback } from 'react'

// Mock do ViewModel para testes
export const useFormState = (initialValues: any = {}) => {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<any>({})
  const [touched, setTouched] = useState<any>({})
  const [dirty, setDirty] = useState(false)
  const [isValid, setIsValid] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitCount, setSubmitCount] = useState(0)
  const [lastSubmittedAt, setLastSubmittedAt] = useState<Date | null>(null)

  const setValue = useCallback((field: string, value: any) => {
    setValues((prev: any) => ({ ...prev, [field]: value }))
    setTouched((prev: any) => ({ ...prev, [field]: true }))
    setDirty(true)
  }, [])

  const setError = useCallback((field: string, error: string[] | null) => {
    setErrors((prev: any) => {
      const newErrors = { ...prev }
      if (error) {
        newErrors[field] = error
      } else {
        delete newErrors[field]
      }
      return newErrors
    })
  }, [])

  const validateField = useCallback((field: string, value: any, rules: any) => {
    if (!rules) return null

    const fieldErrors: string[] = []

    if (rules.required && (!value || value.toString().trim() === '')) {
      fieldErrors.push(`${field} é obrigatório`)
    }

    if (rules.minLength && value.toString().length < rules.minLength) {
      fieldErrors.push(`${field} deve ter pelo menos ${rules.minLength} caracteres`)
    }

    if (rules.maxLength && value.toString().length > rules.maxLength) {
      fieldErrors.push(`${field} deve ter no máximo ${rules.maxLength} caracteres`)
    }

    if (rules.pattern && !rules.pattern.test(value.toString())) {
      fieldErrors.push(`${field} tem formato inválido`)
    }

    if (rules.min !== undefined && Number(value) < rules.min) {
      fieldErrors.push(`${field} deve ser pelo menos ${rules.min}`)
    }

    if (rules.max !== undefined && Number(value) > rules.max) {
      fieldErrors.push(`${field} deve ser no máximo ${rules.max}`)
    }

    return fieldErrors.length > 0 ? fieldErrors : null
  }, [])

  const validateForm = useCallback((validationRules: any) => {
    const formErrors: Record<string, string[]> = {}
    let formIsValid = true

    Object.keys(validationRules).forEach(field => {
      const value = values[field]
      const fieldErrors = validateField(field, value, validationRules[field])
      
      if (fieldErrors) {
        formErrors[field] = fieldErrors
        formIsValid = false
      }
    })

    setErrors(formErrors)
    setIsValid(formIsValid)

    return { isValid: formIsValid, errors: formErrors }
  }, [values, validateField])

  const submitForm = useCallback(async (onSubmit: Function, validationRules?: any) => {
    if (validationRules) {
      const validation = validateForm(validationRules)
      if (!validation.isValid) {
        throw new Error('Formulário inválido')
      }
    }

    setIsSubmitting(true)

    try {
      await onSubmit(values)
      
      setSubmitCount(prev => prev + 1)
      setLastSubmittedAt(new Date())
      
      return { success: true }
    } catch (error) {
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }, [values, validateForm])

  const resetForm = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setDirty(false)
    setIsValid(false)
    setIsSubmitting(false)
    setSubmitCount(0)
    setLastSubmittedAt(null)
  }, [initialValues])

  const isFieldDirty = useCallback((field: string) => {
    const currentValue = values[field]
    const initialValue = initialValues[field]
    return currentValue !== initialValue
  }, [values, initialValues])

  const isFieldTouched = useCallback((field: string) => {
    return touched[field] === true
  }, [touched])

  const isFieldValid = useCallback((field: string) => {
    return !errors[field] || errors[field].length === 0
  }, [errors])

  const getFieldError = useCallback((field: string) => {
    return errors[field] || null
  }, [errors])

  const touchField = useCallback((field: string) => {
    setTouched((prev: any) => ({ ...prev, [field]: true }))
  }, [])

  const touchAllFields = useCallback(() => {
    const allTouched = Object.keys(values).reduce((acc, field) => {
      acc[field] = true
      return acc
    }, {} as Record<string, boolean>)
    
    setTouched(allTouched)
  }, [values])

  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  const updateValues = useCallback((newValues: any) => {
    setValues(newValues)
    setDirty(true)
  }, [])

  return {
    values,
    errors,
    touched,
    dirty,
    isValid,
    isSubmitting,
    submitCount,
    lastSubmittedAt,
    actions: {
      setValue,
      setError,
      validateField,
      validateForm,
      submitForm,
      resetForm,
      touchField,
      touchAllFields,
      clearErrors,
      updateValues
    },
    helpers: {
      isFieldDirty,
      isFieldTouched,
      isFieldValid,
      getFieldError
    }
  }
}
