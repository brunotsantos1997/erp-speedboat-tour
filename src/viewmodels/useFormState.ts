import { useState, useCallback } from 'react'

type FormValues = Record<string, unknown>
type FieldErrors = Record<string, string[]>
type TouchedFields = Record<string, boolean>

interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  min?: number
  max?: number
}

type ValidationRules = Record<string, ValidationRule>
type SubmitHandler<TValues extends FormValues> = (values: TValues) => Promise<unknown> | unknown

const toComparableString = (value: unknown) => String(value ?? '')

// Mock do ViewModel para testes
export const useFormState = <TValues extends FormValues = FormValues>(initialValues: TValues = {} as TValues) => {
  const [values, setValues] = useState<TValues>(initialValues)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState<TouchedFields>({})
  const [dirty, setDirty] = useState(false)
  const [isValid, setIsValid] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitCount, setSubmitCount] = useState(0)
  const [lastSubmittedAt, setLastSubmittedAt] = useState<Date | null>(null)

  const setValue = useCallback((field: string, value: unknown) => {
    setValues(prev => ({ ...prev, [field]: value }) as TValues)
    setTouched(prev => ({ ...prev, [field]: true }))
    setDirty(true)
  }, [])

  const setError = useCallback((field: string, error: string[] | null) => {
    setErrors(prev => {
      const newErrors = { ...prev }

      if (error) {
        newErrors[field] = error
      } else {
        delete newErrors[field]
      }

      return newErrors
    })
  }, [])

  const validateField = useCallback((field: string, value: unknown, rules?: ValidationRule) => {
    if (!rules) return null

    const fieldErrors: string[] = []
    const stringValue = toComparableString(value)

    if (rules.required && stringValue.trim() === '') {
      fieldErrors.push(`${field} e obrigatorio`)
    }

    if (rules.minLength && stringValue.length < rules.minLength) {
      fieldErrors.push(`${field} deve ter pelo menos ${rules.minLength} caracteres`)
    }

    if (rules.maxLength && stringValue.length > rules.maxLength) {
      fieldErrors.push(`${field} deve ter no maximo ${rules.maxLength} caracteres`)
    }

    if (rules.pattern && !rules.pattern.test(stringValue)) {
      fieldErrors.push(`${field} tem formato invalido`)
    }

    if (rules.min !== undefined && Number(value) < rules.min) {
      fieldErrors.push(`${field} deve ser pelo menos ${rules.min}`)
    }

    if (rules.max !== undefined && Number(value) > rules.max) {
      fieldErrors.push(`${field} deve ser no maximo ${rules.max}`)
    }

    return fieldErrors.length > 0 ? fieldErrors : null
  }, [])

  const validateForm = useCallback((validationRules: ValidationRules) => {
    const formErrors: FieldErrors = {}
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

  const submitForm = useCallback(async (onSubmit: SubmitHandler<TValues>, validationRules?: ValidationRules) => {
    if (validationRules) {
      const validation = validateForm(validationRules)
      if (!validation.isValid) {
        throw new Error('Formulario invalido')
      }
    }

    setIsSubmitting(true)

    try {
      await onSubmit(values)
      setSubmitCount(prev => prev + 1)
      setLastSubmittedAt(new Date())
      return { success: true }
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
    setTouched(prev => ({ ...prev, [field]: true }))
  }, [])

  const touchAllFields = useCallback(() => {
    const allTouched = Object.keys(values).reduce((acc, field) => {
      acc[field] = true
      return acc
    }, {} as TouchedFields)

    setTouched(allTouched)
  }, [values])

  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  const updateValues = useCallback((newValues: TValues) => {
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
