import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useFirebaseAuth } from '../contexts/FirebaseAuthContext';
import googleSheetsService from '../services/googleSheets';

function RepresentativeForm() {
  const { userProfile, addSubmission, representatives, loadRepresentatives, submissions, loadSubmissions } = useFirebaseAuth();
  
  // Load representatives and submissions for autocomplete - only once
  React.useEffect(() => {
    const loadData = async () => {
      try {
        await loadRepresentatives();
        await loadSubmissions();
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only once
  const [formData, setFormData] = useState({
    personName: '',
    totalPeople: '',
    amountPerPerson: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // Get unique person names for autocomplete from representatives (مندوبين/مشرفين)
  const existingPersons = useMemo(() => {
    const persons = new Set();
    
    console.log('Representatives data:', representatives);
    console.log('Submissions data:', submissions);
    
    // Add names from representatives for autocomplete
    if (representatives && representatives.length > 0) {
      representatives.forEach(rep => {
        console.log('Processing representative:', rep);
        if (rep.name && rep.name.trim()) {
          persons.add(rep.name.trim());
          console.log('Added representative name:', rep.name.trim());
        }
      });
    }
    
    // Also add names from previous submissions for additional options
    if (submissions && submissions.length > 0) {
      submissions.forEach(submission => {
        if (submission.personName && submission.personName.trim()) {
          persons.add(submission.personName.trim());
        }
        if (submission.submittedBy && submission.submittedBy.trim() && submission.submittedBy !== 'غير محدد') {
          persons.add(submission.submittedBy.trim());
        }
      });
    }
    
    const finalPersons = Array.from(persons).sort();
    console.log('Final persons list:', finalPersons);
    return finalPersons;
  }, [representatives, submissions]);

  // Filter persons based on search term
  const filteredPersons = useMemo(() => {
    if (!searchTerm.trim()) {
      return existingPersons;
    }
    return existingPersons.filter(person => 
      person.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [existingPersons, searchTerm]);



  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'personName') {
      setSearchTerm(value);
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      setShowDropdown(true);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePersonSelect = (personName) => {
    setFormData(prev => ({
      ...prev,
      personName: personName
    }));
    setSearchTerm(personName);
    setShowDropdown(false);
  };

  const calculateTotal = () => {
    const total = parseInt(formData.totalPeople) || 0;
    const amount = parseInt(formData.amountPerPerson) || 0;
    return total * amount;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);


    // Get location from representative data
    const selectedRepresentative = representatives.find(rep => rep.name === formData.personName);
    const personLocation = selectedRepresentative?.location || 'غير محدد';

    // Submit real data
    try {
      const submissionData = {
        ...formData,
        location: personLocation,
        villageName: personLocation, // Keep compatibility with existing database
        totalAmount: calculateTotal(),
        timestamp: new Date().toISOString(),
        representativeName: userProfile?.name || 'مندوب غير معروف',
        submittedBy: formData.personName || 'غير محدد'
      };

      console.log('Submission data before sending:', submissionData);
      console.log('formData.personName:', formData.personName);
      console.log('submittedBy value:', submissionData.submittedBy);

      // Save to Firebase
      await addSubmission(submissionData);
      
      // Try to send to Google Sheets (optional)
      try {
        console.log('Attempting to send data to Google Sheets...');
        console.log('Submission data:', submissionData);
        const sheetsResult = await googleSheetsService.sendToGoogleSheets(submissionData);
        console.log('Google Sheets result:', sheetsResult);
        if (sheetsResult.success) {
          console.log('✅ Data sent to Google Sheets successfully');
        } else {
          console.log('❌ Google Sheets integration failed:', sheetsResult.message);
        }
      } catch (sheetsError) {
        console.error('❌ Google Sheets error (non-critical):', sheetsError);
        // Don't fail the entire submission if Google Sheets fails
      }
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
      
      // Reset form
      setFormData({
        personName: '',
        totalPeople: '',
        amountPerPerson: 50
      });
    } catch (error) {
      console.error('Submission error:', error);
      console.error('Error details:', error.message);
      console.error('Error code:', error.code);
      alert('حدث خطأ أثناء إرسال البيانات: ' + error.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-600 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
            نموذج بيانات المندوب
          </h1>
          <p className="text-gray-600 text-lg">
            أدخل بيانات الشخص والمستفيدين
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/20">
          {success && (
            <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 text-green-700 px-4 py-3 rounded-xl backdrop-blur-sm">
              <div className="flex items-center">
                <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                تم إرسال البيانات بنجاح!
              </div>
            </div>
          )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="personName" className="block text-sm font-semibold text-gray-700 mb-2">
                اسم الشخص *
              </label>
              <div className="relative" ref={dropdownRef}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                  </svg>
                </div>
                <input
                  id="personName"
                  name="personName"
                  type="text"
                  value={formData.personName}
                  onChange={handleInputChange}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 backdrop-blur-sm"
                  placeholder="اكتب اسم الشخص"
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className={`w-5 h-5 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                
                {showDropdown && filteredPersons.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                    {filteredPersons.map(person => (
                      <div
                        key={person}
                        onClick={() => handlePersonSelect(person)}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        {person}
                      </div>
                    ))}
                  </div>
                )}
                
                {showDropdown && filteredPersons.length === 0 && existingPersons.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg">
                    <div className="px-4 py-3 text-gray-500 text-center">
                      لا توجد نتائج مطابقة
                    </div>
                  </div>
                )}
                
                {showDropdown && existingPersons.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg">
                    <div className="px-4 py-3 text-gray-500 text-center">
                      لا توجد أسماء محفوظة
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                المكان
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={representatives.find(rep => rep.name === formData.personName)?.location || 'اختر الشخص أولاً'}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-600 cursor-not-allowed"
                  placeholder="سيتم تحديد المكان تلقائياً حسب الشخص المختار"
                  disabled
                  readOnly
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">المكان يتم تحديده تلقائياً من بيانات الشخص المختار</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="totalPeople" className="block text-sm font-semibold text-gray-700 mb-2">
                العدد الكلي للأشخاص *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
                <input
                  id="totalPeople"
                  name="totalPeople"
                  type="number"
                  min="0"
                  value={formData.totalPeople}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 backdrop-blur-sm"
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="amountPerPerson" className="block text-sm font-semibold text-gray-700 mb-2">
                مبلغ الفرد (جنيه)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="amountPerPerson"
                  name="amountPerPerson"
                  type="number"
                  min="0"
                  value={formData.amountPerPerson}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 backdrop-blur-sm"
                  placeholder="50"
                />
              </div>
            </div>
          </div>


          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200/50">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-700">
                إجمالي المبلغ المطلوب:
              </span>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {calculateTotal().toLocaleString('ar-EG')} جنيه
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg"
          >
            <div className="flex items-center justify-center">
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white ml-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="mr-2">جاري الإرسال...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  إرسال البيانات
                </>
              )}
            </div>
          </button>
        </form>

        </div>
      </div>
    </div>
  );
}

export default RepresentativeForm;
