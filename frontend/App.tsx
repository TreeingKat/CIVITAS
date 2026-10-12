import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8080').replace(/\/$/, '');
type Portal = 'resident' | 'candidate' | 'admin';
type Screen = 'auth' | 'home' | 'tenant' | 'candidate-dashboard' | 'candidate-form';
type Member = { id: string; email: string; fullName: string; role: string; emailVerified: boolean };
type Tenant = { id: string; name: string; code: string; city: string; createdBy: string };
type Candidate = { id: string; tenantId: string; tenantName: string; contestingPost: string; status: string; registeredAt: string };
const POSTS = ['Chairperson', 'Secretary', 'Treasurer', 'Committee Member'];

async function api<T>(path: string, method = 'GET', body?: unknown, token?: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${API_URL}${path}`, { method, signal: controller.signal, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
    const raw = await response.text();
    let data: any = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch { data = { message: raw }; }
    if (!response.ok) throw new Error(data.detail || data.message || data.error || data.title || `Request failed (${response.status})`);
    return data as T;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error(`The server at ${API_URL} did not respond within 15 seconds.`);
    if (error instanceof TypeError) throw new Error(`Can't reach CIVITAS backend at ${API_URL}. Check that the backend is running and the phone is on the same Wi-Fi.`);
    throw error;
  } finally { clearTimeout(timeout); }
}

export default function App() {
  const [token, setToken] = useState('');
  const [member, setMember] = useState<Member | null>(null);
  const [booting, setBooting] = useState(true);
  const [screen, setScreen] = useState<Screen>('auth');
  const [portal, setPortal] = useState<Portal>('resident');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [tenantId, setTenantId] = useState('');
  const [post, setPost] = useState(POSTS[0]);
  const [statement, setStatement] = useState('');
  const [phone, setPhone] = useState('');
  const [candidateStep, setCandidateStep] = useState(1);
  const [tenantName, setTenantName] = useState('');
  const [tenantCode, setTenantCode] = useState('');
  const [city, setCity] = useState('');

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('civitas_token');
      if (saved) {
        try {
          const profile = await api<Member>('/api/auth/me', 'GET', undefined, saved);
          const savedPortal = await AsyncStorage.getItem('civitas_portal');
          const isCandidate = profile.role === 'CANDIDATE' || savedPortal === 'candidate';
          setToken(saved); setEmail(profile.email); setMember(profile);
          setPortal(isCandidate ? 'candidate' : profile.role === 'PLATFORM_ADMIN' ? 'admin' : 'resident');
          setScreen(isCandidate ? 'candidate-dashboard' : 'home');
        } catch {
          await AsyncStorage.removeItem('civitas_token');
          await AsyncStorage.removeItem('civitas_portal');
        }
      }
      setBooting(false);
    })();
  }, []);

  async function run(action: () => Promise<void>) {
    setBusy(true); setNotice('');
    try { await action(); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Something went wrong. Please try again.'); }
    finally { setBusy(false); }
  }

  async function requestOtp() {
    await run(async () => {
      const result = await api<{ developmentOtp?: string }>('/api/auth/register', 'POST', { email: email.trim(), fullName: fullName.trim(), password });
      setOtpSent(true);
      if (result.developmentOtp) setOtp(result.developmentOtp);
      setNotice(result.developmentOtp ? 'Development verification code filled in.' : 'Verification code sent. Check your email.');
    });
  }

  async function verifyOtp() {
    await run(async () => {
      const result = await api<{ token: string; member: Member }>('/api/auth/verify-email', 'POST', { email: email.trim(), code: otp.trim() });
      await AsyncStorage.setItem('civitas_token', result.token);
      await AsyncStorage.setItem('civitas_portal', portal);
      setToken(result.token); setMember(result.member); setScreen(portal === 'candidate' ? 'candidate-dashboard' : 'home');
      setOtpSent(false); setOtp('');
      setNotice(portal === 'candidate' ? 'Email verified. Welcome to your candidate portal.' : 'Email verified. You are signed in.');
    });
  }

  async function login() {
    await run(async () => {
      const path = portal === 'admin' ? '/api/auth/admin/login' : '/api/auth/login';
      const result = await api<{ token: string; member: Member }>(path, 'POST', { email: email.trim(), password });
      await AsyncStorage.setItem('civitas_token', result.token);
      await AsyncStorage.setItem('civitas_portal', portal);
      setToken(result.token); setMember(result.member); setScreen(portal === 'candidate' ? 'candidate-dashboard' : 'home');
      setNotice(portal === 'candidate' ? 'Signed in to your candidate portal.' : 'Signed in.');
    });
  }

  async function loadResidentData() {
    if (!token) return;
    await run(async () => {
      const [societies, applications] = await Promise.all([
        api<Tenant[]>('/api/tenants/mine', 'GET', undefined, token),
        api<Candidate[]>('/api/candidates/mine', 'GET', undefined, token),
      ]);
      setTenants(societies); setCandidates(applications);
    });
  }

  async function loadCandidateData() {
    if (!token) return;
    await run(async () => {
      const [societies, applications] = await Promise.all([
        api<Tenant[]>('/api/tenants', 'GET', undefined, token),
        api<Candidate[]>('/api/candidates/mine', 'GET', undefined, token),
      ]);
      setTenants(societies); setCandidates(applications);
      if (!tenantId && societies.length) setTenantId(societies[0].id);
    });
  }

  useEffect(() => {
    if (token && screen === 'home') loadResidentData();
    if (token && (screen === 'candidate-dashboard' || screen === 'candidate-form')) loadCandidateData();
  }, [token, screen]);

  async function submitCandidate() {
    const selected = tenants.find(item => item.id === tenantId);
    await run(async () => {
      const created = await api<Candidate>('/api/candidates/register', 'POST', { tenantId, contestingPost: post, statement: statement.trim(), phone: phone.trim() || undefined }, token);
      setCandidates(old => [created, ...old]);
      setMember(old => old ? { ...old, role: 'CANDIDATE' } : old);
      setPortal('candidate'); await AsyncStorage.setItem('civitas_portal', 'candidate');
      setCandidateStep(1); setStatement(''); setPhone(''); setScreen('candidate-dashboard');
      setNotice(`Application submitted to ${selected?.name || created.tenantName}.`);
    });
  }

  async function createTenant() {
    await run(async () => {
      const tenant = await api<Tenant>('/api/tenants', 'POST', { name: tenantName.trim(), code: tenantCode.trim(), city: city.trim() }, token);
      setTenants(old => [tenant, ...old]); setTenantName(''); setTenantCode(''); setCity('');
      setNotice(`${tenant.name} was created.`); setScreen('home');
    });
  }

  async function logout() {
    await AsyncStorage.removeItem('civitas_token'); await AsyncStorage.removeItem('civitas_portal');
    setToken(''); setMember(null); setScreen('auth'); setPortal('resident'); setOtpSent(false); setNotice('You have signed out.');
  }

  if (booting) return <View style={styles.center}><ActivityIndicator size="large" color="#0e7490"/><Text style={styles.muted}>Loading CIVITAS…</Text></View>;

  return <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <StatusBar style="dark"/>
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {screen === 'auth' ? <>
        <Brand/>
        <View style={styles.authHero}><Text style={styles.eyebrow}>A better way to participate</Text><Text style={styles.authTitle}>Community decisions, made together.</Text><Text style={styles.muted}>Sign in to continue or choose a dedicated portal.</Text></View>
        {!!notice && <Text style={styles.notice}>{notice}</Text>}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>CONTINUE AS</Text>
          <View style={styles.portalRow}>{([['resident','Resident'],['candidate','Candidate'],['admin','Admin']] as [Portal,string][]).map(([key,label])=><Pressable key={key} onPress={()=>{setPortal(key);setAuthMode('login');setOtpSent(false);setOtp('');setNotice('');}} style={[styles.portalButton,portal===key&&styles.portalButtonActive]}><Text style={[styles.portalText,portal===key&&styles.portalTextActive]}>{label}</Text></Pressable>)}</View>
          <Text style={styles.sectionTitle}>{otpSent?'Verify your email':portal==='admin'?'Administrator sign in':portal==='candidate'?(authMode==='login'?'Candidate sign in':'Candidate account'):(authMode==='login'?'Welcome back':'Create your account')}</Text>
          <Text style={styles.muted}>{otpSent?`Enter the six-digit code sent to ${email}.`:portal==='admin'?'Platform administrator accounts are provisioned by CIVITAS.':portal==='candidate'?'Your candidate workspace is separate from the resident portal.':authMode==='login'?'Sign in to your resident account.':'Register as a resident to get started.'}</Text>
          {!otpSent ? <>
            {portal!=='admin'&&authMode==='register'&&<Field label="Full name" value={fullName} onChangeText={setFullName} placeholder="Your full name"/>}
            <Field label="Email address" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none"/>
            <Field label="Password" value={password} onChangeText={setPassword} placeholder="At least 8 characters" secureTextEntry/>
            <Button title={portal==='admin'?'Sign in as administrator':authMode==='login'?'Sign in':'Create account'} onPress={portal==='admin'?login:authMode==='login'?login:requestOtp} disabled={busy||!email.includes('@')||password.length<8||(portal!=='admin'&&authMode==='register'&&!fullName.trim())}/>
            {portal!=='admin'&&<Button title={authMode==='login'?'Create an account':'Already registered? Sign in'} kind="secondary" onPress={()=>setAuthMode(authMode==='login'?'register':'login')}/>}
          </> : <>
            <Field label="6-digit verification code" value={otp} onChangeText={setOtp} placeholder="123456" keyboardType="number-pad" maxLength={6}/>
            <Button title="Verify email" onPress={verifyOtp} disabled={busy||otp.length!==6}/>
            <Button title="Resend code" kind="secondary" onPress={()=>run(async()=>{const result=await api<{developmentOtp?:string}>('/api/auth/resend-otp','POST',{email:email.trim()});if(result.developmentOtp)setOtp(result.developmentOtp);setNotice(result.developmentOtp?'Development code refreshed.':'A new code was sent.');})} disabled={busy}/>
            <Button title="Back to sign in" kind="secondary" onPress={()=>{setOtpSent(false);setOtp('');setAuthMode('login');}}/>
          </>}
          <Text style={styles.apiHint}>Connected to {API_URL}</Text>
        </View>
        <Footer/>
      </> : portal === 'candidate' ? <>
        <View style={styles.candidateTop}><Pressable onPress={()=>screen==='candidate-form'?setScreen('candidate-dashboard'):logout()} style={styles.backButton}><Text style={styles.backText}>{screen==='candidate-form'?'‹  My applications':'↪  Sign out'}</Text></Pressable><Brand compact/><View style={styles.candidateBadge}><Text style={styles.badgeText}>CANDIDATE PORTAL</Text></View></View>
        {!!notice&&<Text style={styles.notice}>{notice}</Text>}
        {screen==='candidate-dashboard' ? <>
          <View style={styles.candidateHero}><Text style={styles.eyebrowLight}>YOUR VOICE MATTERS</Text><Text style={styles.candidateTitle}>Step forward for your community.</Text><Text style={styles.candidateSubtitle}>Manage your candidacy and keep track of every application in one place.</Text><View style={styles.heroFoot}><Text style={styles.heroFootText}>{candidates.length} {candidates.length===1?'application':'applications'}</Text><Text style={styles.heroFootText}>•</Text><Text style={styles.heroFootText}>{member?.fullName||email}</Text></View></View>
          <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>Your applications</Text><Text style={styles.muted}>Live status from your society elections</Text></View><Pressable onPress={loadCandidateData} style={styles.refreshPill}><Text style={styles.refreshText}>↻  Refresh</Text></Pressable></View>
          {candidates.length===0 ? <View style={styles.emptyCard}><View style={styles.emptyIcon}><Text style={styles.emptyIconText}>✦</Text></View><Text style={styles.emptyTitle}>Your journey starts here</Text><Text style={styles.muted}>Choose a society and tell members why you want to serve. Your application will appear here once submitted.</Text><Button title="Start a candidate application" onPress={()=>{setCandidateStep(1);setScreen('candidate-form');setNotice('');}}/></View> : <>
            {candidates.map((item,index)=><View key={item.id} style={styles.applicationCard}><View style={styles.applicationTop}><View style={styles.applicationIcon}><Text style={styles.applicationIconText}>C</Text></View><View style={styles.applicationHeading}><Text style={styles.itemTitle}>{item.contestingPost}</Text><Text style={styles.muted}>{item.tenantName}</Text></View><StatusPill status={item.status}/></View><View style={styles.applicationDivider}/><View style={styles.applicationBottom}><Text style={styles.small}>SUBMITTED  {formatDate(item.registeredAt)}</Text><Text style={styles.applicationNumber}>APPLICATION {String(candidates.length-index).padStart(2,'0')}</Text></View></View>)}
            <Button title="Apply for another position" onPress={()=>{setCandidateStep(1);setScreen('candidate-form');setNotice('');}}/>
          </>}
          <Footer/>
        </> : <>
          <View style={styles.formIntro}><Text style={styles.eyebrow}>CANDIDATE APPLICATION</Text><Text style={styles.formTitle}>Tell us how you’ll serve.</Text><Text style={styles.muted}>A few simple steps to put your name forward.</Text></View>
          <View style={styles.progressRow}>{['Society','Your profile','Review'].map((label,index)=><View key={label} style={styles.progressItem}><View style={[styles.progressDot,(index+1)<=candidateStep&&styles.progressDotActive]}><Text style={[styles.progressNum,(index+1)<=candidateStep&&styles.progressNumActive]}>{(index+1)<candidateStep?'✓':index+1}</Text></View><Text style={[styles.progressLabel,(index+1)<=candidateStep&&styles.progressLabelActive]}>{label}</Text>{index<2&&<View style={[styles.progressLine,index+1<candidateStep&&styles.progressLineActive]}/>}</View>)}</View>
          {candidateStep===1&&<View style={styles.formCard}><Text style={styles.stepTitle}>Choose your society</Text><Text style={styles.muted}>Select the community where you’d like to stand for election.</Text>{tenants.length===0 ? <View style={styles.emptySociety}><Text style={styles.emptyTitle}>No societies are available yet</Text><Text style={styles.muted}>A CIVITAS administrator must add a society before candidate applications can be submitted.</Text><Button title="Try again" kind="secondary" onPress={loadCandidateData}/></View> : tenants.map(society=><Pressable key={society.id} onPress={()=>setTenantId(society.id)} style={[styles.societyOption,tenantId===society.id&&styles.societyOptionSelected]}><View style={[styles.societyMark,tenantId===society.id&&styles.societyMarkSelected]}><Text style={[styles.societyMarkText,tenantId===society.id&&styles.societyMarkTextSelected]}>{society.name.slice(0,1).toUpperCase()}</Text></View><View style={styles.societyInfo}><Text style={styles.itemTitle}>{society.name}</Text><Text style={styles.muted}>{society.city}  ·  {society.code}</Text></View><View style={[styles.radioOuter,tenantId===society.id&&styles.radioOuterSelected]}>{tenantId===society.id&&<View style={styles.radioInner}/>}</View></Pressable>)}<Button title="Continue" onPress={()=>setCandidateStep(2)} disabled={!tenantId||tenants.length===0}/></View>}
          {candidateStep===2&&<View style={styles.formCard}><Text style={styles.stepTitle}>Your candidate profile</Text><Text style={styles.muted}>Choose a position and share a short statement with your community.</Text><Text style={styles.fieldLabel}>POSITION YOU’RE CONTESTING</Text><View style={styles.postGrid}>{POSTS.map(item=><Pressable key={item} onPress={()=>setPost(item)} style={[styles.postOption,post===item&&styles.postOptionSelected]}><Text style={[styles.postOptionText,post===item&&styles.postOptionTextSelected]}>{item}</Text></Pressable>)}</View><Field label="CANDIDATE STATEMENT" value={statement} onChangeText={setStatement} placeholder="What would you focus on if elected?" multiline maxLength={1000}/><Text style={styles.charCount}>{statement.length}/1000</Text><Field label="CONTACT PHONE (OPTIONAL)" value={phone} onChangeText={setPhone} placeholder="Your phone number" keyboardType="phone-pad" maxLength={30}/><View style={styles.buttonRow}><Button title="Back" kind="secondary" onPress={()=>setCandidateStep(1)} full/><Button title="Review" onPress={()=>setCandidateStep(3)} disabled={!statement.trim()} full/></View></View>}
          {candidateStep===3&&<View style={styles.formCard}><Text style={styles.stepTitle}>Review your application</Text><Text style={styles.muted}>Please confirm these details before submitting.</Text><View style={styles.reviewBlock}><Text style={styles.fieldLabel}>SOCIETY</Text><Text style={styles.reviewValue}>{tenants.find(item=>item.id===tenantId)?.name||'Selected society'}</Text><Text style={styles.muted}>{tenants.find(item=>item.id===tenantId)?.city}</Text></View><View style={styles.reviewBlock}><Text style={styles.fieldLabel}>POSITION</Text><Text style={styles.reviewValue}>{post}</Text></View><View style={styles.reviewBlock}><Text style={styles.fieldLabel}>YOUR STATEMENT</Text><Text style={styles.reviewStatement}>{statement}</Text></View><View style={styles.reviewNote}><Text style={styles.reviewNoteText}>Your application will be submitted with PENDING status for review by the election administrators.</Text></View><View style={styles.buttonRow}><Button title="Edit details" kind="secondary" onPress={()=>setCandidateStep(2)} full/><Button title="Submit application" onPress={submitCandidate} disabled={busy||!tenantId||!statement.trim()} full/></View></View>}
          <Footer/>
        </>}
      </> : <>
        <Brand/>
        <View style={styles.welcome}><Text style={styles.eyebrow}>{member?.role==='PLATFORM_ADMIN'?'PLATFORM ADMINISTRATION':'RESIDENT PORTAL'}</Text><Text style={styles.formTitle}>Hello, {member?.fullName||email}</Text><Text style={styles.muted}>{member?.role==='PLATFORM_ADMIN'?'Manage housing communities on CIVITAS.':'Your community at a glance.'}</Text></View>
        {!!notice&&<Text style={styles.notice}>{notice}</Text>}
        <View style={styles.nav}><Pressable style={[styles.navItem,screen==='home'&&styles.navActive]} onPress={()=>setScreen('home')}><Text style={[styles.navText,screen==='home'&&styles.navTextActive]}>{member?.role==='PLATFORM_ADMIN'?'Overview':'My account'}</Text></Pressable>{member?.role==='PLATFORM_ADMIN'&&<Pressable style={[styles.navItem,screen==='tenant'&&styles.navActive]} onPress={()=>setScreen('tenant')}><Text style={[styles.navText,screen==='tenant'&&styles.navTextActive]}>Society</Text></Pressable>}</View>
        {screen==='home'&&<>
          <View style={styles.stats}><View style={styles.stat}><Text style={styles.statNum}>{tenants.length}</Text><Text style={styles.muted}>Societies</Text></View><View style={styles.stat}><Text style={styles.statNum}>{candidates.length}</Text><Text style={styles.muted}>Your applications</Text></View></View>
          <View style={styles.card}><Text style={styles.sectionTitle}>{member?.role==='PLATFORM_ADMIN'?'Society management':'Your societies'}</Text>{tenants.length===0?<Text style={styles.muted}>{member?.role==='PLATFORM_ADMIN'?'No society created yet.':'Society creation is managed by CIVITAS administrators.'}</Text>:tenants.map(item=><View key={item.id} style={styles.listItem}><Text style={styles.itemTitle}>{item.name}</Text><Text style={styles.muted}>{item.city} · {item.code}</Text><Text selectable style={styles.small}>ID: {item.id}</Text></View>)}{member?.role==='PLATFORM_ADMIN'&&<Button title="Create a society" onPress={()=>setScreen('tenant')}/>}</View>
          <Button title="Refresh data" kind="secondary" onPress={loadResidentData}/><Button title="Sign out" kind="secondary" onPress={logout}/>
        </>}
        {screen==='tenant'&&member?.role==='PLATFORM_ADMIN'&&<View style={styles.card}><Text style={styles.formTitle}>Create a society</Text><Text style={styles.muted}>Add a housing society to CIVITAS.</Text><Field label="Society name" value={tenantName} onChangeText={setTenantName} placeholder="Green Meadows CHS"/><Field label="Tenant code" value={tenantCode} onChangeText={setTenantCode} placeholder="GREENMEADOWS" autoCapitalize="characters"/><Field label="City" value={city} onChangeText={setCity} placeholder="Mumbai"/><Button title="Create society" onPress={createTenant} disabled={busy||!tenantName.trim()||tenantCode.trim().length<3||!city.trim()}/><Button title="Back to overview" kind="secondary" onPress={()=>setScreen('home')}/></View>}
        <Footer/>
      </>}
      {busy&&<View style={styles.loading}><ActivityIndicator color="#0e7490"/><Text style={styles.muted}>Working…</Text></View>}
    </ScrollView>
  </KeyboardAvoidingView>;
}

function Brand({compact=false}:{compact?:boolean}) { return <View style={[styles.brand,compact&&styles.brandCompact]}><View style={styles.logo}><Text style={styles.logoText}>C</Text></View><View><Text style={styles.brandTitle}>CIVITAS</Text><Text style={styles.brandSub}>Housing society elections</Text></View></View>; }
function Footer(){return <Text style={styles.footer}>CIVITAS  ·  Demo implementation  ·  Not for conducting a real election</Text>;}
function formatDate(value:string){const date=new Date(value);return Number.isNaN(date.getTime())?value:date.toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'});}
function StatusPill({status}:{status:string}){const pending=status.toUpperCase()==='PENDING';return <View style={[styles.statusPill,pending?styles.statusPending:styles.statusOther]}><View style={[styles.statusDot,pending?styles.statusDotPending:styles.statusDotOther]}/><Text style={[styles.statusText,pending?styles.statusTextPending:styles.statusTextOther]}>{status}</Text></View>;}
function Field(props:any){const[visible,setVisible]=useState(false);const{label,secureTextEntry,...inputProps}=props;return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><View style={secureTextEntry?styles.passwordRow:undefined}><TextInput {...inputProps} secureTextEntry={secureTextEntry?!visible:undefined} style={[styles.input,secureTextEntry&&styles.passwordInput,props.multiline&&styles.multiline]} placeholderTextColor="#93a4b5"/>{secureTextEntry&&<Pressable onPress={()=>setVisible(value=>!value)} accessibilityRole="button" accessibilityLabel={visible?'Hide password':'Show password'} style={styles.passwordToggle}><Text style={styles.passwordToggleText}>{visible?'Hide':'Show'}</Text></Pressable>}</View></View>;}
function Button({title,onPress,disabled,kind='primary',full=false}:{title:string;onPress:()=>void;disabled?:boolean;kind?:'primary'|'secondary';full?:boolean}){return <Pressable onPress={onPress} disabled={disabled} style={[styles.button,kind==='secondary'&&styles.buttonSecondary,disabled&&styles.buttonDisabled,full&&styles.buttonFull]}><Text style={[styles.buttonText,kind==='secondary'&&styles.buttonSecondaryText]}>{title}</Text></Pressable>;}

const styles=StyleSheet.create({
  root:{flex:1,backgroundColor:'#f4f7f8'},container:{padding:22,paddingTop:Platform.OS==='android'?42:58,paddingBottom:42,maxWidth:640,width:'100%',alignSelf:'center'},center:{flex:1,alignItems:'center',justifyContent:'center',gap:12,backgroundColor:'#f4f7f8'},brand:{flexDirection:'row',alignItems:'center',gap:12,marginBottom:24},brandCompact:{marginBottom:0},logo:{width:46,height:46,borderRadius:15,backgroundColor:'#0e7490',alignItems:'center',justifyContent:'center'},logoText:{fontSize:27,fontWeight:'900',color:'#fff'},brandTitle:{fontSize:21,fontWeight:'900',letterSpacing:2,color:'#102a43'},brandSub:{fontSize:11,color:'#72869a',marginTop:2},authHero:{marginBottom:20},eyebrow:{fontSize:11,fontWeight:'900',letterSpacing:1.6,color:'#0e7490',marginBottom:9},eyebrowLight:{fontSize:11,fontWeight:'900',letterSpacing:1.6,color:'#99e6dc',marginBottom:10},authTitle:{fontSize:31,lineHeight:37,fontWeight:'900',color:'#102a43',marginBottom:8},formTitle:{fontSize:28,lineHeight:34,fontWeight:'900',color:'#102a43',marginBottom:7},candidateTitle:{fontSize:31,lineHeight:37,fontWeight:'900',color:'#fff',marginBottom:10},candidateSubtitle:{fontSize:14,lineHeight:22,color:'#d6e7ec'},card:{backgroundColor:'#fff',borderRadius:22,padding:20,marginBottom:16,borderWidth:1,borderColor:'#e4ebef'},sectionTitle:{fontSize:19,fontWeight:'800',color:'#102a43',marginBottom:8},stepTitle:{fontSize:21,fontWeight:'800',color:'#102a43',marginBottom:7},muted:{fontSize:14,lineHeight:21,color:'#6c8297'},notice:{backgroundColor:'#e0f2fe',borderRadius:14,padding:13,marginBottom:16,color:'#075985',lineHeight:20,fontWeight:'600'},portalRow:{flexDirection:'row',gap:7,marginVertical:13},portalButton:{flex:1,paddingVertical:12,alignItems:'center',backgroundColor:'#f0f5f7',borderRadius:11},portalButtonActive:{backgroundColor:'#0e7490'},portalText:{fontSize:12,fontWeight:'800',color:'#486175'},portalTextActive:{color:'#fff'},field:{marginTop:16},fieldLabel:{fontSize:11,fontWeight:'900',letterSpacing:.8,color:'#50677b',marginBottom:8},input:{borderWidth:1,borderColor:'#d8e2e8',borderRadius:13,paddingHorizontal:14,paddingVertical:13,fontSize:15,color:'#102a43',backgroundColor:'#fbfdfe'},passwordRow:{position:'relative',justifyContent:'center'},passwordInput:{paddingRight:66},passwordToggle:{position:'absolute',right:12,paddingVertical:10,paddingHorizontal:6},passwordToggleText:{fontSize:13,fontWeight:'800',color:'#0e7490'},multiline:{minHeight:126,textAlignVertical:'top'},button:{backgroundColor:'#0e7490',borderRadius:13,paddingVertical:15,paddingHorizontal:16,alignItems:'center',marginTop:17,minHeight:50,justifyContent:'center'},buttonText:{color:'#fff',fontSize:14,fontWeight:'800'},buttonSecondary:{backgroundColor:'#f0f5f7',borderWidth:1,borderColor:'#d9e4e9'},buttonSecondaryText:{color:'#365266'},buttonDisabled:{opacity:.4},buttonFull:{flex:1},apiHint:{fontSize:10,color:'#98a8b6',marginTop:16,textAlign:'center'},nav:{flexDirection:'row',padding:4,backgroundColor:'#e7eef2',borderRadius:14,marginBottom:18},navItem:{flex:1,paddingVertical:11,alignItems:'center',borderRadius:10},navActive:{backgroundColor:'#fff'},navText:{fontSize:13,fontWeight:'800',color:'#708397'},navTextActive:{color:'#0e7490'},welcome:{marginBottom:20},stats:{flexDirection:'row',gap:12,marginBottom:16},stat:{flex:1,backgroundColor:'#fff',padding:18,borderRadius:17,borderWidth:1,borderColor:'#e4ebef'},statNum:{fontSize:29,fontWeight:'900',color:'#0e7490',marginBottom:4},listItem:{paddingVertical:13,borderBottomWidth:1,borderBottomColor:'#edf1f3'},itemTitle:{fontSize:15,fontWeight:'800',color:'#1c3448',marginBottom:4},small:{fontSize:10,color:'#8799a8',marginTop:8},candidateTop:{marginBottom:21},backButton:{alignSelf:'flex-start',paddingVertical:7,marginBottom:14},backText:{fontSize:13,fontWeight:'800',color:'#0e7490'},candidateBadge:{alignSelf:'flex-start',marginTop:15,paddingHorizontal:11,paddingVertical:7,borderRadius:20,backgroundColor:'#d9f3f0'},badgeText:{fontSize:10,fontWeight:'900',letterSpacing:1,color:'#0f766e'},candidateHero:{backgroundColor:'#123b4a',borderRadius:24,padding:22,marginBottom:25,overflow:'hidden'},heroFoot:{flexDirection:'row',alignItems:'center',gap:9,marginTop:22,paddingTop:15,borderTopWidth:1,borderTopColor:'#42616c'},heroFootText:{fontSize:11,fontWeight:'700',color:'#e0eef1'},sectionHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:14},refreshPill:{backgroundColor:'#e6f3f4',paddingVertical:9,paddingHorizontal:12,borderRadius:20},refreshText:{fontSize:11,fontWeight:'800',color:'#0e7490'},emptyCard:{alignItems:'center',backgroundColor:'#fff',padding:23,borderRadius:22,borderWidth:1,borderColor:'#e3ebef',marginBottom:18},emptyIcon:{height:50,width:50,borderRadius:17,backgroundColor:'#e0f2f1',alignItems:'center',justifyContent:'center',marginBottom:15},emptyIconText:{fontSize:23,fontWeight:'900',color:'#0e7490'},emptyTitle:{fontSize:18,fontWeight:'800',color:'#17364a',marginBottom:7,textAlign:'center'},applicationCard:{backgroundColor:'#fff',borderRadius:18,padding:16,marginBottom:12,borderWidth:1,borderColor:'#e3ebef'},applicationTop:{flexDirection:'row',alignItems:'center',gap:11},applicationIcon:{width:42,height:42,borderRadius:14,backgroundColor:'#e2f3f1',alignItems:'center',justifyContent:'center'},applicationIconText:{fontSize:16,fontWeight:'900',color:'#0e7490'},applicationHeading:{flex:1},applicationDivider:{height:1,backgroundColor:'#edf1f3',marginVertical:13},applicationBottom:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},applicationNumber:{fontSize:9,fontWeight:'900',letterSpacing:.7,color:'#8497a6'},statusPill:{flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:9,paddingVertical:6,borderRadius:20},statusPending:{backgroundColor:'#fff4d8'},statusOther:{backgroundColor:'#e1f4e9'},statusDot:{width:6,height:6,borderRadius:4},statusDotPending:{backgroundColor:'#d59613'},statusDotOther:{backgroundColor:'#2d9c5a'},statusText:{fontSize:10,fontWeight:'900',textTransform:'capitalize'},statusTextPending:{color:'#8a5d00'},statusTextOther:{color:'#16723c'},formIntro:{marginBottom:18},progressRow:{flexDirection:'row',alignItems:'center',marginBottom:19},progressItem:{flexDirection:'row',alignItems:'center'},progressDot:{width:26,height:26,borderRadius:13,backgroundColor:'#e3eaee',alignItems:'center',justifyContent:'center'},progressDotActive:{backgroundColor:'#0e7490'},progressNum:{fontSize:10,fontWeight:'900',color:'#748697'},progressNumActive:{color:'#fff'},progressLabel:{fontSize:10,fontWeight:'700',color:'#8b9aa7',marginLeft:6},progressLabelActive:{color:'#1b596a'},progressLine:{height:1,width:20,backgroundColor:'#dce5e9',marginHorizontal:8},progressLineActive:{backgroundColor:'#0e7490'},formCard:{backgroundColor:'#fff',borderRadius:22,padding:19,borderWidth:1,borderColor:'#e3ebef',marginBottom:18},emptySociety:{marginTop:18,padding:16,borderRadius:16,backgroundColor:'#f5f8f9'},societyOption:{flexDirection:'row',alignItems:'center',gap:12,padding:13,borderRadius:15,borderWidth:1,borderColor:'#e1e9ed',marginTop:11},societyOptionSelected:{borderColor:'#0e7490',backgroundColor:'#f0faf9'},societyMark:{width:41,height:41,borderRadius:13,backgroundColor:'#eef3f5',alignItems:'center',justifyContent:'center'},societyMarkSelected:{backgroundColor:'#0e7490'},societyMarkText:{fontSize:16,fontWeight:'900',color:'#5e7485'},societyMarkTextSelected:{color:'#fff'},societyInfo:{flex:1},radioOuter:{width:20,height:20,borderRadius:10,borderWidth:1.5,borderColor:'#c4d1d8',alignItems:'center',justifyContent:'center'},radioOuterSelected:{borderColor:'#0e7490'},radioInner:{width:10,height:10,borderRadius:5,backgroundColor:'#0e7490'},postGrid:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:8},postOption:{paddingHorizontal:12,paddingVertical:11,borderWidth:1,borderColor:'#dbe5e9',borderRadius:12},postOptionSelected:{borderColor:'#0e7490',backgroundColor:'#eaf7f6'},postOptionText:{fontSize:12,fontWeight:'700',color:'#526b7d'},postOptionTextSelected:{color:'#0c6474'},charCount:{fontSize:10,color:'#8799a8',textAlign:'right',marginTop:5},buttonRow:{flexDirection:'row',gap:10,marginTop:4},reviewBlock:{paddingVertical:15,borderBottomWidth:1,borderBottomColor:'#edf1f3'},reviewValue:{fontSize:15,fontWeight:'800',color:'#1c3448'},reviewStatement:{fontSize:14,lineHeight:22,color:'#435b6d'},reviewNote:{padding:13,backgroundColor:'#fff7e5',borderRadius:13,marginTop:16},reviewNoteText:{fontSize:12,lineHeight:18,color:'#765a1f',fontWeight:'600'},footer:{fontSize:10,textAlign:'center',color:'#97a7b3',marginTop:25,lineHeight:17},loading:{alignItems:'center',padding:16,gap:8}
});
