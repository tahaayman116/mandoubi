import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useFirebaseAuth } from '../contexts/FirebaseAuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// دالة لتنسيق الأرقام بالعربية مع الفواصل
const formatArabicNumber = (num) => {
  // التحقق من وجود الرقم وأنه صالح
  if (num === undefined || num === null || isNaN(num)) {
    return '0';
  }
  // تحويل الرقم لنص مع فواصل باللغة العربية
  return Number(num).toLocaleString('ar-EG');
};

function AdminDashboard() {
  const { 
    representatives, 
    addRepresentative, 
    deleteRepresentative, 
    clearAllRepresentatives,
    deleteRepresentativeFromAppwrite,
    clearAllRepresentativesFromAppwrite,
    getRepresentativesFromAppwrite,
    submissions,
    deletePersonSubmissions,
    clearAllSubmissions,
    loadSubmissions,
    loadRepresentatives
  } = useFirebaseAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRep, setNewRep] = useState({ name: '', role: 'مندوب', location: '' });
  const [bulkAddMode, setBulkAddMode] = useState(false);
  const [bulkRepData, setBulkRepData] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [appwriteRepresentatives, setAppwriteRepresentatives] = useState([]);
  const [showPersonDetails, setShowPersonDetails] = useState(false);
  const [dataLoaded, setDataLoaded] = useState({ submissions: false, representatives: false });

  // Lazy load data based on active tab
  useEffect(() => {
    if (activeTab === 'reports' && !dataLoaded.submissions) {
      loadSubmissions();
      setDataLoaded(prevState => ({ ...prevState, submissions: true }));
    }
    if (activeTab === 'representatives' && !dataLoaded.representatives) {
      loadRepresentatives();
      setDataLoaded(prevState => ({ ...prevState, representatives: true }));
    }
  }, [activeTab, dataLoaded.submissions, dataLoaded.representatives, loadSubmissions, loadRepresentatives]);

  const handleAddRepresentative = async (e) => {
    e.preventDefault();
    if (newRep.name && newRep.role && newRep.location) {
      try {
        // Add using dual database service (handles both Firebase and Appwrite)
        const result = await addRepresentative(newRep);
        
        if (result) {
          console.log('✅ Representative added successfully to dual database');
        } else {
          console.error('❌ Failed to add representative');
        }
        
        await loadAppwriteRepresentatives(); // Refresh Appwrite data
        setNewRep({ name: '', role: 'مندوب', location: '' });
        setShowAddForm(false);
      } catch (error) {
        console.error('Error adding representative:', error);
        alert('حدث خطأ أثناء إضافة المندوب');
      }
    }
  };

  const handleBulkAddRepresentatives = async () => {
    if (!bulkRepData.trim()) return;
    
    const lines = bulkRepData.split('\n').filter(line => line.trim());
    const representatives = [];
    const errors = [];
    
    // Parse and validate data
    lines.forEach((line, index) => {
      const parts = line.split(',').map(part => part.trim());
      if (parts.length !== 3) {
        errors.push(`السطر ${index + 1}: تنسيق غير صحيح`);
        return;
      }
      
      const [name, role, location] = parts;
      if (!name || !role || !location) {
        errors.push(`السطر ${index + 1}: بيانات ناقصة`);
        return;
      }
      
      if (role !== 'مندوب' && role !== 'مشرف') {
        errors.push(`السطر ${index + 1}: النوع يجب أن يكون "مندوب" أو "مشرف"`);
        return;
      }
      
      representatives.push({ name, role, location });
    });
    
    if (errors.length > 0) {
      alert('أخطاء في البيانات:\n' + errors.join('\n'));
      return;
    }
    
    if (representatives.length === 0) {
      alert('لا توجد بيانات صالحة للإضافة');
      return;
    }
    
    // Confirm bulk add
    if (!window.confirm(`هل تريد إضافة ${representatives.length} شخص؟`)) {
      return;
    }
    
    try {
      let successCount = 0;
      let failCount = 0;
      
      // Add representatives one by one with progress
      for (let i = 0; i < representatives.length; i++) {
        try {
          await addRepresentative(representatives[i]);
          successCount++;
          console.log(`✅ Added ${representatives[i].name} (${i + 1}/${representatives.length})`);
        } catch (error) {
          failCount++;
          console.error(`❌ Failed to add ${representatives[i].name}:`, error);
        }
      }
      
      await loadAppwriteRepresentatives(); // Refresh Appwrite data
      
      alert(`تم الانتهاء من الإضافة:\n✅ نجح: ${successCount}\n❌ فشل: ${failCount}`);
      
      if (successCount > 0) {
        setBulkRepData('');
        setBulkAddMode(false);
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error in bulk add:', error);
      alert('حدث خطأ أثناء الإضافة المتعددة');
    }
  };

  const handleClearAllData = async () => {
    if (window.confirm('سيتم حذف جميع البيانات نهائيا')) {
      try {
        // Clear from both databases simultaneously
        const results = await Promise.allSettled([
          clearAllRepresentatives(),
          clearAllRepresentativesFromAppwrite()
        ]);
        
        const firebaseCount = results[0].status === 'fulfilled' ? results[0].value : 0;
        const appwriteCount = results[1].status === 'fulfilled' ? results[1].value : 0;
        const firebaseSuccess = results[0].status === 'fulfilled';
        const appwriteSuccess = results[1].status === 'fulfilled';
        
        if (firebaseSuccess && appwriteSuccess) {
          alert(`تم مسح ${firebaseCount} عنصر من Firebase و ${appwriteCount} عنصر من Appwrite بنجاح`);
        } else if (firebaseSuccess) {
          alert(`تم مسح ${firebaseCount} عنصر من Firebase فقط - فشل Appwrite`);
        } else if (appwriteSuccess) {
          alert(`تم مسح ${appwriteCount} عنصر من Appwrite فقط - فشل Firebase`);
        } else {
          alert('فشل في مسح البيانات من القاعدتين');
        }
        
        await loadAppwriteRepresentatives(); // Refresh Appwrite data
      } catch (error) {
        console.error('Error clearing all representatives:', error);
        alert('حدث خطأ أثناء مسح البيانات');
      }
    }
  };

  // Delete person and all their submissions
  const handleDeletePerson = async (personName) => {
    if (window.confirm(`هل أنت متأكد من حذف "${personName}" وجميع بياناته؟\nسيتم حذف جميع الإرسالات الخاصة بهذا الشخص نهائياً.`)) {
      try {
        const deletedCount = await deletePersonSubmissions(personName);
        alert(`تم حذف "${personName}" و ${deletedCount} إرسال بنجاح`);
      } catch (error) {
        console.error('Error deleting person:', error);
        alert('حدث خطأ أثناء حذف الشخص');
      }
    }
  };

  // Clear all submissions data
  const handleClearAllSubmissions = async () => {
    if (window.confirm('هل أنت متأكد من مسح جميع بيانات الإرسالات؟\nسيتم حذف جميع البيانات نهائياً ولا يمكن استرجاعها.')) {
      try {
        const deletedCount = await clearAllSubmissions();
        alert(`تم مسح ${deletedCount} إرسال بنجاح`);
      } catch (error) {
        console.error('Error clearing all submissions:', error);
        alert('حدث خطأ أثناء مسح البيانات');
      }
    }
  };

  const loadAppwriteRepresentatives = React.useCallback(async () => {
    try {
      const data = await getRepresentativesFromAppwrite();
      setAppwriteRepresentatives(data || []);
    } catch (error) {
      console.error('Error loading Appwrite representatives:', error);
      setAppwriteRepresentatives([]);
    }
  }, [getRepresentativesFromAppwrite]);

  const handleDeleteRepresentative = async (rep) => {
    if (window.confirm(`هل أنت متأكد من حذف "${rep.name}"؟`)) {
      try {
        // Delete from both databases simultaneously
        const results = await Promise.allSettled([
          deleteRepresentative(rep.id),
          findAndDeleteFromAppwrite(rep.name, rep.role)
        ]);
        
        const firebaseSuccess = results[0].status === 'fulfilled';
        const appwriteSuccess = results[1].status === 'fulfilled';
        
        if (firebaseSuccess && appwriteSuccess) {
          alert(`تم حذف "${rep.name}" بنجاح`);
        } else if (firebaseSuccess) {
          alert(`تم حذف "${rep.name}" من قاعدة البيانات الأساسية`);
        } else if (appwriteSuccess) {
          alert(`تم حذف "${rep.name}" من قاعدة البيانات الاحتياطية`);
        } else {
          alert(`فشل في حذف "${rep.name}"`);
        }
        
        await loadAppwriteRepresentatives(); // Refresh Appwrite data
      } catch (error) {
        console.error('Error deleting representative:', error);
        alert('حدث خطأ أثناء حذف المندوب');
      }
    }
  };

  // Helper function to find and delete from Appwrite by name/role

  const findAndDeleteFromAppwrite = async (name, role) => {
    const appwriteRep = appwriteRepresentatives.find(r => r.name === name && r.role === role);
    if (appwriteRep) {
      return await deleteRepresentativeFromAppwrite(appwriteRep.$id || appwriteRep.id);
    }
    throw new Error('Representative not found in Appwrite');
  };

  // Load Appwrite data on component mount
  React.useEffect(() => {
    loadAppwriteRepresentatives();
  }, [loadAppwriteRepresentatives]);


  const totalStats = useMemo(() => {
    if (!submissions || submissions.length === 0) {
      return {
        totalPeople: 0,
        totalAmount: 0,
        totalVillages: 0,
        monthlyPeople: 0,
        monthlyAmount: 0,
        averagePerVillage: 0,
        activeReps: 0
      };
    }
    
    // حساب إجمالي الأشخاص من جميع الإرسالات
    const totalPeople = submissions.reduce((sum, sub) => sum + (parseInt(sub.totalPeople) || 0), 0);
    
    
    // حساب عدد القرى الفريدة
    const uniqueVillages = new Set(submissions?.map(sub => sub.villageName) || []).size;
    
    // حساب بيانات هذا الشهر
    const now = new Date();
    const thisMonth = submissions.filter(sub => {
      const subDate = new Date(sub.submittedAt);
      return subDate.getMonth() === now.getMonth() && subDate.getFullYear() === now.getFullYear();
    });
    
    return {
      totalPeople: totalPeople,
      totalAmount: submissions.reduce((sum, sub) => sum + (parseFloat(sub.totalAmount) || 0), 0),
      totalVillages: uniqueVillages,
      monthlyPeople: thisMonth.reduce((sum, sub) => sum + (parseInt(sub.totalPeople) || 0), 0),
      monthlyAmount: thisMonth.reduce((sum, sub) => sum + (parseFloat(sub.totalAmount) || 0), 0),
      averagePerVillage: uniqueVillages > 0 ? Math.round(totalPeople / uniqueVillages) : 0,
      activeReps: representatives ? representatives.filter(rep => rep.active).length : 0
    };
  }, [submissions, representatives]);

  const chartData = submissions?.map(sub => ({
    name: sub.villageName,
    people: sub.totalPeople,
    amount: sub.totalAmount
  })) || [];


  const filteredSubmissions = useMemo(() => {
    if (!submissions || submissions.length === 0) return [];
    return submissions.filter(sub => {
      const matchesSearch = searchTerm === '' || 
        sub.villageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.submittedBy.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [submissions, searchTerm]);

  // Get person details
  const getPersonDetails = useCallback((personName) => {
    if (!submissions || submissions.length === 0) {
      return {
        name: personName,
        role: 'مندوب',
        submissions: [],
        totalPeople: 0,
        totalAmount: 0
      };
    }
    
    const personSubmissions = submissions.filter(sub => sub.submittedBy === personName);
    const totalPeople = personSubmissions.reduce((sum, sub) => sum + (parseInt(sub.totalPeople) || 0), 0);
    const totalAmount = personSubmissions.reduce((sum, sub) => sum + (parseFloat(sub.totalAmount) || 0), 0);
    const rep = representatives.find(r => r.name === personName);
    
    return {
      name: personName,
      role: rep?.role || 'مندوب',
      submissions: personSubmissions,
      totalPeople,
      totalAmount
    };
  }, [submissions, representatives]);

  // Get filtered persons based on search and filters
  const filteredPersons = useMemo(() => {
    if (!submissions || submissions.length === 0) return [];
    
    const persons = new Set();
    submissions.forEach(sub => {
      if (sub.submittedBy) {
        persons.add(sub.submittedBy);
      }
    });
    
    return Array.from(persons).filter(person => {
      const matchesSearch = searchTerm === '' || person.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;
      
      // Role filter
      if (roleFilter !== 'all') {
        const personDetails = getPersonDetails(person);
        if (personDetails.role !== roleFilter) return false;
      }
      
      return true;
    });
  }, [submissions, searchTerm, roleFilter, getPersonDetails]);

  // Sort filtered persons
  const sortedPersons = useMemo(() => {
    return [...filteredPersons].sort((a, b) => {
      const aDetails = getPersonDetails(a);
      const bDetails = getPersonDetails(b);
      
      switch (sortBy) {
        case 'totalAmount':
          return bDetails.totalAmount - aDetails.totalAmount;
        case 'totalPeople':
          return bDetails.totalPeople - aDetails.totalPeople;
        case 'submissionCount':
          return bDetails.submissions.length - aDetails.submissions.length;
        case 'name':
        default:
          return a.localeCompare(b, 'ar');
      }
    });
  }, [filteredPersons, sortBy, getPersonDetails]);

  // Statistics by role
  const roleStats = useMemo(() => {
    const mandoubStats = { totalPeople: 0, totalAmount: 0, submissionCount: 0 };
    const moshrefStats = { totalPeople: 0, totalAmount: 0, submissionCount: 0 };
    
    submissions.forEach(sub => {
      const rep = representatives.find(r => r.name === sub.submittedBy);
      const role = rep?.role || 'مندوب';
      const stats = role === 'مشرف' ? moshrefStats : mandoubStats;
      
      stats.totalPeople += parseInt(sub.totalPeople) || 0;
      stats.totalAmount += parseFloat(sub.totalAmount) || 0;
      stats.submissionCount += 1;
    });
    
    return { mandoubStats, moshrefStats };
  }, [submissions, representatives]);

  const exportToCSV = async () => {
    try {
      // Load submissions if not already loaded
      await loadSubmissions();
      
      const headers = ['القرية', 'العدد الكلي', 'المبلغ الإجمالي', 'المندوب', 'التاريخ'];
      const csvContent = [
        headers.join(','),
        ...filteredSubmissions.map(sub => [
          sub.villageName || sub.location || 'غير محدد',
          sub.totalPeople || 0,
          sub.totalAmount || 0,
          sub.submittedBy || sub.representativeName || 'غير محدد',
          sub.timestamp ? new Date(sub.timestamp).toLocaleDateString('ar-EG') : 
          sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('ar-EG') : 'غير محدد'
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `campaign_data_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      alert('حدث خطأ أثناء تصدير البيانات');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Professional Header */}
      <div className="mb-8 bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">🎯 لوحة التحكم الرئيسية</h1>
            <p className="text-primary-100">إدارة البيانات والإحصائيات</p>
          </div>
          <div className="mt-4 md:mt-0 text-center">
            <div className="text-3xl font-bold">{formatArabicNumber(totalStats.totalVillages)}</div>
            <div className="text-primary-200 text-sm">قرية مسجلة</div>
          </div>
        </div>
      </div>

      {/* Professional Tabs */}
      <div className="mb-8">
        <nav className="flex space-x-1 space-x-reverse bg-gray-100 p-1 rounded-lg shadow-inner">
          {[
            { id: 'overview', label: '📊 نظرة عامة' },
            { id: 'representatives', label: '👥 إضافة مندوب أو مشرف' },
            { id: 'reports', label: '📈 التقارير' },
            { id: 'statistics', label: '📊 إحصائيات الأدوار' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white text-primary-600 shadow-md transform scale-105'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Enhanced KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">👥 إجمالي الأشخاص</p>
                  <p className="text-3xl font-bold mt-2">{formatArabicNumber(totalStats.totalPeople)}</p>
                  <p className="text-blue-200 text-xs mt-1">في {formatArabicNumber(totalStats.totalVillages)} قرية</p>
                </div>
                <div className="bg-blue-400 bg-opacity-30 rounded-full p-3">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                  </svg>
                </div>
              </div>
            </div>


            <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">💰 إجمالي المبلغ</p>
                  <p className="text-3xl font-bold mt-2">{formatArabicNumber(totalStats.totalAmount)} ج</p>
                  <p className="text-purple-200 text-xs mt-1">المبلغ الإجمالي</p>
                </div>
                <div className="bg-purple-400 bg-opacity-30 rounded-full p-3">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">📍 عدد القرى</p>
                  <p className="text-3xl font-bold mt-2">{formatArabicNumber(totalStats.totalVillages)}</p>
                  <p className="text-orange-200 text-xs mt-1">قرى مختلفة</p>
                </div>
                <div className="bg-orange-400 bg-opacity-30 rounded-full p-3">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card shadow-lg border-t-4 border-t-primary-500">
              <h3 className="text-xl font-bold mb-6 text-gray-900">📊 إحصائيات القرى</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData.sort((a, b) => b.people - a.people).slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                  <XAxis dataKey="name" stroke="#64748b"/>
                  <YAxis stroke="#64748b"/>
                  <Tooltip />
                  <Bar dataKey="people" fill="#3b82f6" radius={[4, 4, 0, 0]} name="إجمالي الأشخاص"/>
                  <Bar dataKey="amount" fill="#22c55e" radius={[4, 4, 0, 0]} name="المبلغ"/>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card shadow-lg border-t-4 border-t-green-500">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">📊 إحصائيات المشروع</h3>
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📈</div>
                <div className="space-y-3">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{formatArabicNumber(totalStats.totalPeople)}</div>
                    <div className="text-sm text-blue-700">إجمالي الأشخاص</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{formatArabicNumber(totalStats.totalAmount)} ج</div>
                    <div className="text-sm text-green-700">إجمالي المبلغ</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{formatArabicNumber(totalStats.totalVillages)}</div>
                    <div className="text-sm text-orange-700">عدد القرى</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Representatives Tab */}
      {activeTab === 'representatives' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-2xl font-bold text-gray-900">👥 إدارة المندوبين والمشرفين</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-primary flex items-center gap-2 shadow-lg"
              >
                ➕ إضافة مندوب أو مشرف
              </button>
              <button
                onClick={handleClearAllData}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg transition-colors"
              >
                🗑️ مسح جميع البيانات
              </button>
            </div>
          </div>

          {showAddForm && (
            <div className="card shadow-lg border-l-4 border-l-primary-500">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">
                إضافة مندوبين أو مشرفين جدد
              </h3>
              
              <div className="mb-4">
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setBulkAddMode(false)}
                    className={`px-4 py-2 rounded-lg transition-colors ${!bulkAddMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    إضافة فردي
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkAddMode(true)}
                    className={`px-4 py-2 rounded-lg transition-colors ${bulkAddMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    إضافة متعدد
                  </button>
                </div>
              </div>

              {!bulkAddMode ? (
                <form onSubmit={handleAddRepresentative} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="الاسم الكامل"
                    value={newRep.name}
                    onChange={(e) => setNewRep({...newRep, name: e.target.value})}
                    className="input-field"
                    required
                  />
                  <select
                    value={newRep.role}
                    onChange={(e) => setNewRep({...newRep, role: e.target.value})}
                    className="input-field"
                    required
                  >
                    <option value="مندوب">مندوب</option>
                    <option value="مشرف">مشرف</option>
                  </select>
                  <input
                    type="text"
                    placeholder="المكان/القرية"
                    value={newRep.location}
                    onChange={(e) => setNewRep({...newRep, location: e.target.value})}
                    className="input-field"
                    required
                  />
                  <div className="md:col-span-3 flex space-x-2 space-x-reverse">
                    <button type="submit" className="btn-primary">إضافة</button>
                    <button 
                      type="button" 
                      onClick={() => setShowAddForm(false)}
                      className="btn-secondary"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-700 mb-2">
                      📝 أدخل البيانات بالتنسيق التالي (كل سطر شخص واحد):
                    </p>
                    <p className="text-sm text-blue-600 font-mono">
                      الاسم,النوع,المكان
                    </p>
                    <p className="text-xs text-blue-500 mt-1">
                      مثال: أحمد محمد,مندوب,القاهرة
                    </p>
                  </div>
                  
                  <textarea
                    placeholder="أحمد محمد,مندوب,القاهرة&#10;فاطمة علي,مشرف,الجيزة&#10;محمد حسن,مندوب,الإسكندرية"
                    value={bulkRepData}
                    onChange={(e) => setBulkRepData(e.target.value)}
                    className="input-field min-h-32"
                    rows="6"
                  />
                  
                  <div className="flex space-x-2 space-x-reverse">
                    <button 
                      type="button"
                      onClick={handleBulkAddRepresentatives}
                      className="btn-primary"
                      disabled={!bulkRepData.trim()}
                    >
                      إضافة الكل ({bulkRepData.split('\n').filter(line => line.trim()).length} أشخاص)
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setShowAddForm(false);
                        setBulkRepData('');
                        setBulkAddMode(false);
                      }}
                      className="btn-secondary"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="card shadow-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                      👤 الاسم
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                      👤 النوع
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                      📍 المكان
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                      ⚙️ الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {representatives.map((rep) => (
                    <tr key={rep.id || rep.$id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {rep.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          rep.role === 'مشرف' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {rep.role || 'مندوب'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        📍 {rep.location || 'غير محدد'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDeleteRepresentative(rep)}
                          className="bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-3 rounded text-xs transition-colors duration-200"
                        >
                          🗑️ حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-8">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 -mx-6 -mt-6 px-6 pt-6 pb-8 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">التقارير والإحصائيات</h2>
                <p className="text-gray-600">عرض شامل لجميع البيانات والإحصائيات المفصلة</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={exportToCSV}
                  className="inline-flex items-center px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  تصدير Excel
                </button>
                <button
                  onClick={handleClearAllSubmissions}
                  className="inline-flex items-center px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  مسح جميع البيانات
                </button>
              </div>
            </div>
          </div>

          {/* Professional Search and Filters */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Enhanced Search */}
                <div className="relative flex-1 max-w-lg">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="🔍 البحث عن الأشخاص..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pr-12 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-gray-500 bg-white shadow-sm transition-all duration-200 hover:border-gray-400"
                  />
                </div>

                {/* Role Filter */}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">👤 الدور:</label>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white shadow-sm min-w-[120px]"
                  >
                    <option value="all">جميع الأدوار</option>
                    <option value="مندوب">مندوب</option>
                    <option value="مشرف">مشرف</option>
                  </select>
                </div>

                {/* Sort Options */}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">📊 ترتيب:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white shadow-sm min-w-[140px]"
                  >
                    <option value="name">الاسم (أبجدي)</option>
                    <option value="totalAmount">💰 أعلى مبلغ</option>
                    <option value="totalPeople">👥 أعلى أشخاص</option>
                    <option value="submissionCount">📝 أعلى إرسالات</option>
                    <option value="totalReceived">✅ أعلى مستلمين</option>
                  </select>
                </div>
              </div>
              
              {/* Quick Sort Buttons */}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => setSortBy('totalAmount')}
                  className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                    sortBy === 'totalAmount' 
                      ? 'bg-purple-100 text-purple-800 ring-2 ring-purple-200' 
                      : 'bg-gray-100 text-gray-700 hover:bg-purple-50 hover:text-purple-700'
                  }`}
                >
                  💰 أعلى مبلغ
                </button>
                <button
                  onClick={() => setSortBy('totalPeople')}
                  className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                    sortBy === 'totalPeople' 
                      ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-200' 
                      : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  👥 أعلى أشخاص
                </button>
                <button
                  onClick={() => setSortBy('submissionCount')}
                  className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                    sortBy === 'submissionCount' 
                      ? 'bg-green-100 text-green-800 ring-2 ring-green-200' 
                      : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700'
                  }`}
                >
                  📝 أعلى إرسالات
                </button>
                <button
                  onClick={() => setSortBy('totalReceived')}
                  className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                    sortBy === 'totalReceived' 
                      ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-200' 
                      : 'bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                >
                  ✅ أعلى مستلمين
                </button>
                <button
                  onClick={() => setSortBy('name')}
                  className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                    sortBy === 'name' 
                      ? 'bg-gray-200 text-gray-800 ring-2 ring-gray-300' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🔤 أبجدي
                </button>
              </div>
            </div>
          </div>

          {/* Professional Data Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">قائمة الأشخاص والإحصائيات</h3>
              <p className="text-sm text-gray-600 mt-1">
                {sortedPersons ? sortedPersons.length : 0} شخص
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider border-l border-gray-200">
                      الشخص
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-l border-gray-200">
                      الدور
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-l border-gray-200">
                      الإرسالات
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-l border-gray-200">
                      إجمالي الأشخاص
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      المبلغ الإجمالي
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {!sortedPersons || sortedPersons.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium mb-2">لا توجد نتائج</h3>
                          <p className="text-sm max-w-sm">لم يتم العثور على أشخاص تطابق معايير البحث الحالية</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sortedPersons && sortedPersons
                      .map((person, index) => {
                        const personDetails = getPersonDetails(person);
                        
                        return (
                          <tr 
                            key={index} 
                            className="hover:bg-blue-50 transition-colors cursor-pointer"
                            onClick={() => {
                              setSelectedPerson(person);
                              setShowPersonDetails(true);
                            }}
                          >
                            <td className="px-6 py-4 whitespace-nowrap border-l border-gray-200">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                    <span className="text-sm font-medium text-gray-700">
                                      {person.charAt(0)}
                                    </span>
                                  </div>
                                </div>
                                <div className="mr-4">
                                  <div className="text-sm font-medium text-gray-900">{person}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center border-l border-gray-200">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                (representatives.find(r => r.name === person)?.role || 'مندوب') === 'مشرف' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {(representatives.find(r => r.name === person)?.role || 'مندوب') === 'مشرف' ? '👨‍💼 مشرف' : '👤 مندوب'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center border-l border-gray-200">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {formatArabicNumber(personDetails.submissions.length)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center border-l border-gray-200">
                              <span className="text-sm font-medium text-gray-900">
                                {formatArabicNumber(personDetails.totalPeople)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center border-l border-gray-200">
                              <span className="text-sm font-medium text-green-600">
                                {formatArabicNumber(personDetails.totalAmount)} ج
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePerson(person);
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-3 rounded text-xs transition-colors duration-200 flex items-center gap-1 mx-auto"
                              >
                                🗑️ حذف
                              </button>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'statistics' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">📊 إحصائيات الأدوار</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* مندوب Statistics */}
            <div className="card shadow-lg border-t-4 border-t-blue-500">
              <h3 className="text-xl font-bold mb-6 text-blue-700 flex items-center">
                👤 إحصائيات المندوبين
              </h3>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-700 font-medium">إجمالي الأشخاص</span>
                    <span className="text-2xl font-bold text-blue-800">{formatArabicNumber(roleStats.mandoubStats.totalPeople)}</span>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-green-700 font-medium">إجمالي المبلغ</span>
                    <span className="text-2xl font-bold text-green-800">{formatArabicNumber(roleStats.mandoubStats.totalAmount)} ج</span>
                  </div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-orange-700 font-medium">عدد الإرسالات</span>
                    <span className="text-2xl font-bold text-orange-800">{formatArabicNumber(roleStats.mandoubStats.submissionCount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* مشرف Statistics */}
            <div className="card shadow-lg border-t-4 border-t-purple-500">
              <h3 className="text-xl font-bold mb-6 text-purple-700 flex items-center">
                👑 إحصائيات المشرفين
              </h3>
              <div className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-purple-700 font-medium">إجمالي الأشخاص</span>
                    <span className="text-2xl font-bold text-purple-800">{formatArabicNumber(roleStats.moshrefStats.totalPeople)}</span>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-green-700 font-medium">إجمالي المبلغ</span>
                    <span className="text-2xl font-bold text-green-800">{formatArabicNumber(roleStats.moshrefStats.totalAmount)} ج</span>
                  </div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-orange-700 font-medium">عدد الإرسالات</span>
                    <span className="text-2xl font-bold text-orange-800">{formatArabicNumber(roleStats.moshrefStats.submissionCount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Professional Person Details Modal */}
      {showPersonDetails && selectedPerson && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
            {(() => {
              const personDetails = typeof selectedPerson === 'string' ? getPersonDetails(selectedPerson) : selectedPerson;
              const completionRate = personDetails.totalPeople > 0 ? Math.round((personDetails.totalReceived / personDetails.totalPeople) * 100) : 0;
              
              return (
                <>
                  {/* Clean Professional Header */}
                  <div className="bg-white border-b border-gray-200 px-8 py-6">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-xl font-bold text-gray-700">
                            {(typeof selectedPerson === 'string' ? selectedPerson : selectedPerson.name).charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">{typeof selectedPerson === 'string' ? selectedPerson : selectedPerson.name}</h2>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              personDetails.role === 'مشرف' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {personDetails.role === 'مشرف' ? '👨‍💼 مشرف' : '👤 مندوب'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowPersonDetails(false)}
                        className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg p-2 transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
                    {/* Enhanced Statistics Cards */}
                    <div className="p-8 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-sm font-medium text-gray-600">إجمالي الأشخاص</h3>
                              <p className="text-3xl font-bold text-blue-600 mt-2">{formatArabicNumber(personDetails.totalPeople)}</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-full">
                              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-green-500 hover:shadow-xl transition-shadow">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-sm font-medium text-gray-600">إجمالي المبلغ</h3>
                              <p className="text-3xl font-bold text-green-600 mt-2">{formatArabicNumber(personDetails.totalAmount)} ج</p>
                              <div className="flex items-center mt-2">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div className="bg-green-500 h-2 rounded-full" style={{width: `${completionRate}%`}}></div>
                                </div>
                                <span className="text-xs text-gray-500 ml-2">{completionRate}%</span>
                              </div>
                            </div>
                            <div className="bg-green-100 p-3 rounded-full">
                              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-purple-500 hover:shadow-xl transition-shadow">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-sm font-medium text-gray-600">المبلغ الإجمالي</h3>
                              <p className="text-3xl font-bold text-purple-600 mt-2">{formatArabicNumber(personDetails.totalAmount)}</p>
                              <p className="text-sm text-gray-500">جنيه مصري</p>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-full">
                              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-orange-500 hover:shadow-xl transition-shadow">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-sm font-medium text-gray-600">عدد الإرسالات</h3>
                              <p className="text-3xl font-bold text-orange-600 mt-2">{formatArabicNumber(personDetails.submissions.length)}</p>
                              <p className="text-sm text-gray-500">إرسال مكتمل</p>
                            </div>
                            <div className="bg-orange-100 p-3 rounded-full">
                              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2 2z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="px-8 py-4 bg-white border-b border-gray-200">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-4">
                          <div className="text-sm text-gray-600">
                            📅 تاريخ آخر تحديث: <span className="font-medium text-gray-900">
                              {personDetails.submissions && personDetails.submissions.length > 0 ? 
                                (() => {
                                  console.log('Submissions data:', personDetails.submissions);
                                  
                                  // Try different possible date field names and sort by date
                                  const validSubmissions = personDetails.submissions
                                    .map(sub => {
                                      const dateValue = sub.submittedAt || sub.timestamp || sub.createdAt || sub.date;
                                      return { ...sub, dateValue };
                                    })
                                    .filter(sub => sub.dateValue && sub.dateValue !== 'undefined' && sub.dateValue !== null)
                                    .sort((a, b) => {
                                      let dateA, dateB;
                                      
                                      // Parse date A
                                      if (typeof a.dateValue === 'string') {
                                        dateA = new Date(a.dateValue);
                                      } else if (a.dateValue && typeof a.dateValue === 'object' && a.dateValue.seconds) {
                                        dateA = new Date(a.dateValue.seconds * 1000);
                                      } else {
                                        dateA = new Date(a.dateValue);
                                      }
                                      
                                      // Parse date B
                                      if (typeof b.dateValue === 'string') {
                                        dateB = new Date(b.dateValue);
                                      } else if (b.dateValue && typeof b.dateValue === 'object' && b.dateValue.seconds) {
                                        dateB = new Date(b.dateValue.seconds * 1000);
                                      } else {
                                        dateB = new Date(b.dateValue);
                                      }
                                      
                                      return dateB.getTime() - dateA.getTime(); // Sort descending (newest first)
                                    });
                                  
                                  console.log('Valid submissions sorted:', validSubmissions);
                                  
                                  if (validSubmissions.length > 0) {
                                    // Get the most recent submission (first after sorting)
                                    const latestSubmission = validSubmissions[0];
                                    const dateValue = latestSubmission.dateValue;
                                    
                                    console.log('Latest date value:', dateValue);
                                    
                                    // Try to parse the date
                                    let date;
                                    if (typeof dateValue === 'string') {
                                      date = new Date(dateValue);
                                    } else if (dateValue && typeof dateValue === 'object' && dateValue.seconds) {
                                      // Firebase Timestamp
                                      date = new Date(dateValue.seconds * 1000);
                                    } else {
                                      date = new Date(dateValue);
                                    }
                                    
                                    console.log('Parsed date:', date);
                                    
                                    if (!isNaN(date.getTime())) {
                                      return date.toLocaleDateString('ar-EG', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        weekday: 'long'
                                      });
                                    }
                                  }
                                  return 'لا توجد تواريخ صالحة';
                                })()
                                : 'لا توجد بيانات'
                              }
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            ⏰ الوقت: <span className="font-medium text-gray-900">
                              {personDetails.submissions && personDetails.submissions.length > 0 ? 
                                (() => {
                                  const validSubmissions = personDetails.submissions
                                    .map(sub => {
                                      const dateValue = sub.submittedAt || sub.timestamp || sub.createdAt || sub.date;
                                      return { ...sub, dateValue };
                                    })
                                    .filter(sub => sub.dateValue && sub.dateValue !== 'undefined' && sub.dateValue !== null)
                                    .sort((a, b) => {
                                      let dateA, dateB;
                                      
                                      // Parse date A
                                      if (typeof a.dateValue === 'string') {
                                        dateA = new Date(a.dateValue);
                                      } else if (a.dateValue && typeof a.dateValue === 'object' && a.dateValue.seconds) {
                                        dateA = new Date(a.dateValue.seconds * 1000);
                                      } else {
                                        dateA = new Date(a.dateValue);
                                      }
                                      
                                      // Parse date B
                                      if (typeof b.dateValue === 'string') {
                                        dateB = new Date(b.dateValue);
                                      } else if (b.dateValue && typeof b.dateValue === 'object' && b.dateValue.seconds) {
                                        dateB = new Date(b.dateValue.seconds * 1000);
                                      } else {
                                        dateB = new Date(b.dateValue);
                                      }
                                      
                                      return dateB.getTime() - dateA.getTime(); // Sort descending (newest first)
                                    });
                                  
                                  if (validSubmissions.length > 0) {
                                    const latestSubmission = validSubmissions[0];
                                    const dateValue = latestSubmission.dateValue;
                                    
                                    let date;
                                    if (typeof dateValue === 'string') {
                                      date = new Date(dateValue);
                                    } else if (dateValue && typeof dateValue === 'object' && dateValue.seconds) {
                                      // Firebase Timestamp
                                      date = new Date(dateValue.seconds * 1000);
                                    } else {
                                      date = new Date(dateValue);
                                    }
                                    
                                    if (!isNaN(date.getTime())) {
                                      return date.toLocaleTimeString('ar-EG', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      });
                                    }
                                  }
                                  return '--:--';
                                })()
                                : '--:--'
                              }
                            </span>
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => {
                            try {
                              const csvContent = [
                                ['القرية', 'العدد الكلي', 'المبلغ', 'التاريخ'].join(','),
                                ...personDetails.submissions.map(sub => [
                                  sub.villageName || sub.location || 'غير محدد',
                                  sub.totalPeople || 0,
                                  sub.totalAmount || 0,
                                  sub.timestamp ? new Date(sub.timestamp).toLocaleDateString('ar-EG') : 
                                  sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('ar-EG') : 'غير محدد'
                                ].join(','))
                              ].join('\n');
                              
                              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                              const link = document.createElement('a');
                              link.href = URL.createObjectURL(blob);
                              link.download = `تقرير_${personDetails.name}.csv`;
                              link.click();
                            } catch (error) {
                              console.error('Error exporting person report:', error);
                              alert('حدث خطأ أثناء تصدير التقرير');
                            }
                          }}
                          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          تصدير Excel
                        </button>
                      </div>
                    </div>

                    {/* Enhanced Submissions Table */}
                    <div className="p-8">
                      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900">تفاصيل الإرسالات</h3>
                          <p className="text-sm text-gray-600 mt-1">{formatArabicNumber(personDetails.submissions.length)} إرسال مكتمل</p>
                        </div>
                        
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">القرية</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">العدد الكلي</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">المبلغ</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">التاريخ</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {personDetails.submissions?.map((submission, index) => {
                                return (
                                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {formatArabicNumber(index + 1)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold ml-3">
                                          {submission.villageName.charAt(0)}
                                        </div>
                                        <div className="text-sm font-medium text-gray-900">{submission.villageName}</div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {formatArabicNumber(submission.totalPeople)}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                      <span className="text-sm font-medium text-purple-600">
                                        {formatArabicNumber(submission.totalAmount)} ج
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                      {(() => {
                                        const dateValue = submission.submittedAt || submission.timestamp || submission.createdAt || submission.date;
                                        
                                        if (!dateValue || dateValue === 'undefined' || dateValue === null) {
                                          return 'غير محدد';
                                        }
                                        
                                        let date;
                                        if (typeof dateValue === 'string') {
                                          date = new Date(dateValue);
                                        } else if (dateValue && typeof dateValue === 'object' && dateValue.seconds) {
                                          // Firebase Timestamp
                                          date = new Date(dateValue.seconds * 1000);
                                        } else {
                                          date = new Date(dateValue);
                                        }
                                        
                                        if (isNaN(date.getTime())) {
                                          return 'تاريخ غير صالح';
                                        }
                                        
                                        return date.toLocaleDateString('ar-EG');
                                      })()}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
