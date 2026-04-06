import { CheckCircle, FileText, Home } from 'lucide-react'
import { useState } from 'react'

export default function HowToAdopt() {
  const [activeAccordion, setActiveAccordion] = useState(null)

  const adoptionSteps = [
    {
      icon: <FileText size={48} className="text-amber-600" />,
      step: 'Step 1',
      title: 'Browse & Select',
      description: 'Browse our available pets and find one that matches your lifestyle and preferences.',
    },
    {
      icon: <FileText size={48} className="text-amber-600" />,
      step: 'Step 2',
      title: 'Submit Application',
      description: 'Fill out our simple adoption application form to get started with the process.',
    },
    {
      icon: <CheckCircle size={48} className="text-amber-600" />,
      step: 'Step 3',
      title: 'Approval & Meet',
      description: 'Once approved, schedule a time to meet your potential new family member.',
    },
    {
      icon: <Home size={48} className="text-amber-600" />,
      step: 'Step 4',
      title: 'Take Them Home',
      description: 'Complete the final paperwork and bring your new pet home to start your adventure!',
    },
  ]

  const requirements = [
    'Must be at least 18 years old',
    'Valid government-issued ID required',
    'Stable housing (rent or own)',
    'Financial capability to care for a pet',
    'Willingness to provide references',
    'Commitment to provide a loving, safe home',
  ]

  const fees = [
    { service: 'Dog Adoption', fee: '$150' },
    { service: 'Cat Adoption', fee: '$100' },
    { service: 'Adoption Support Package', fee: '$50' },
  ]

  const faqItems = [
    {
      id: 1,
      question: 'How long does the adoption process take?',
      answer:
        'Typically, the adoption process takes 1-2 weeks from application to bringing your pet home. This allows us to review your application and arrange a meet-and-greet.',
    },
    {
      id: 2,
      question: 'What if I have allergies?',
      answer:
        'We have information about hypoallergenic breeds available for adoption. Please mention allergies in your application so we can match you with suitable pets.',
    },
    {
      id: 3,
      question: 'Can I adopt if I rent?',
      answer:
        'Yes, renters can adopt! We just need confirmation from your landlord that pets are allowed in your rental property.',
    },
    {
      id: 4,
      question: 'Is there post-adoption support?',
      answer:
        'We provide ongoing support, training tips, and a community of pet owners. We also offer a support package with additional resources.',
    },
    {
      id: 5,
      question: 'What if the adoption does not work out?',
      answer:
        'While we hope every adoption is forever, we understand things sometimes do not work out. We have a return policy and will help find the pet a new home.',
    },
  ]

  return (
    <div className="w-full bg-white">
      <section className="bg-amber-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">How to Adopt</h1>
          <p className="text-xl opacity-90">Your guide to finding your perfect pet companion</p>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">The Adoption Process</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {adoptionSteps.map((step, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-8 text-center hover:shadow-lg transition">
                <div className="flex justify-center mb-4">
                  {step.icon}
                </div>
                <p className="text-amber-600 font-bold mb-2">{step.step}</p>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Adoption Requirements</h2>
              <p className="text-gray-600 text-lg mb-6">
                To ensure the best match between pets and families, we have some basic requirements:
              </p>
              <ul className="space-y-3">
                {requirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle size={24} className="text-amber-600 flex-shrink-0 mt-1" />
                    <span className="text-gray-700">{req}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="hidden md:block">
              <img src="/family-with-adopted-pets.jpg" alt="Requirements" className="w-full rounded-lg shadow-lg" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Adoption Fees</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {fees.map((item, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-8 text-center hover:shadow-lg transition">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{item.service}</h3>
                <p className="text-4xl font-bold text-amber-600 mb-2">{item.fee}</p>
                <p className="text-gray-600">Includes medical checks and supplies</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqItems.map((item) => (
              <div
                key={item.id}
                className="border border-gray-300 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setActiveAccordion(activeAccordion === item.id ? null : item.id)}
                  className="w-full flex items-center justify-between bg-white hover:bg-gray-50 p-6 transition"
                >
                  <h3 className="text-lg font-semibold text-gray-900 text-left">{item.question}</h3>
                  <span className="text-amber-600 text-2xl flex-shrink-0 ml-4">
                    {activeAccordion === item.id ? '−' : '+'}
                  </span>
                </button>
                {activeAccordion === item.id && (
                  <div className="bg-gray-50 px-6 py-4 border-t border-gray-300">
                    <p className="text-gray-700">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
