'use client';

import { useEffect, useRef, useState } from 'react';
import type { Analysis, Verdict } from '../lib/analysis';

function Shield({className=''}:{className?:string}) {
  return <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M24 5 40 12v12c0 9-7 15-16 20C15 39 8 33 8 24V12L24 5Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/><path d="m17 24 5 5 10-11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function UploadIcon() {
  return <svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><rect x="8" y="10" width="32" height="29" rx="6" stroke="currentColor" strokeWidth="2"/><circle cx="18" cy="20" r="3" stroke="currentColor" strokeWidth="2"/><path d="m10 34 9-8 6 5 6-8 9 11" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M36 5v12m-5-7 5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
const labels:Record<Verdict,string> = {likely_scam:'Likely scam',uncertain:"I'm not sure",no_obvious_red_flags:'No obvious red flags found'};
const hints:Record<Verdict,string> = {likely_scam:'Pause before doing anything.',uncertain:'A little more checking is needed.',no_obvious_red_flags:'This still does not prove legitimacy.'};
const disclaimer='No obvious red flags does not prove legitimacy. This checker can make mistakes. If you are unsure, pause and ask someone you trust.';

export default function Page() {
  const [file,setFile]=useState<File|null>(null);
  const [preview,setPreview]=useState('');
  const [result,setResult]=useState<Analysis|null>(null);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);
  const [dragging,setDragging]=useState(false);
  const input=useRef<HTMLInputElement>(null);
  const request=useRef<AbortController|null>(null);
  const requestId=useRef(0);
  const resultHeading=useRef<HTMLHeadingElement>(null);
  useEffect(()=>{
    if(!file){setPreview('');return;}
    const url=URL.createObjectURL(file);setPreview(url);
    return ()=>URL.revokeObjectURL(url);
  },[file]);
  useEffect(()=>()=>{request.current?.abort();},[]);
  useEffect(()=>{if(result)resultHeading.current?.focus();},[result]);

  function select(next:File|null) {
    request.current?.abort();request.current=null;requestId.current++;
    setLoading(false);setResult(null);setError('');setDragging(false);
    if(input.current)input.current.value='';
    if(next && !['image/png','image/jpeg','image/webp'].includes(next.type)){setFile(null);setError('Choose a PNG, JPG, or WebP screenshot.');return;}
    if(next && (next.size===0 || next.size>8*1024*1024)){setFile(null);setError('Choose a screenshot under 8 MB that is not empty.');return;}
    setFile(next);
  }
  async function analyze() {
    if(!file || loading)return;
    const id=++requestId.current;
    const controller=new AbortController();request.current=controller;
    setLoading(true);setError('');setResult(null);
    try {
      const form=new FormData();form.append('image',file);
      const response=await fetch('/api/analyze',{method:'POST',body:form,signal:AbortSignal.any([controller.signal,AbortSignal.timeout(130_000)])});
      const data=await response.json();
      if(!response.ok)throw new Error(typeof data.error==='string'?data.error:'The checker could not finish. Please try again.');
      if(id===requestId.current)setResult(data as Analysis);
    } catch(cause) {
      if(id!==requestId.current || controller.signal.aborted)return;
      setError(cause instanceof Error && cause.name==='TimeoutError'?'The checker took too long. Please try again, or ask someone you trust.':cause instanceof TypeError?'Could not reach the checker. Please try again.':cause instanceof Error?cause.message:'The checker could not finish. Please try again.');
    } finally {if(id===requestId.current){setLoading(false);request.current=null;}}
  }

  return <>
    <header className="site-header">
      <div className="brand"><span className="brand-mark"><Shield/></span><span>Is this a scam<span className="brand-question">?</span></span></div>
      <span className="local-note"><span className="status-dot"/>On your computer</span>
    </header>
    <main>
      <section className="intro" aria-labelledby="page-title">
        <div className="eyebrow"><span/>A SECOND LOOK, WITH CARE</div>
        <h1 id="page-title">Something feel <span>off?</span></h1>
        <p>Let’s take a look together. Share a screenshot of a message<br className="desktop-break"/> and get a little help deciding what to do next.</p>
        <div className="message-types"><span>Email</span><span className="separator">·</span><span>Text message</span><span className="separator">·</span><span>DM</span></div>
      </section>
      <section className="checker" aria-label="Screenshot checker">
        <div className="upload-column">
          <div className="section-kicker"><span className="step-number">01</span> YOUR MESSAGE</div>
          <input ref={input} id="screenshot" type="file" hidden aria-label="Choose a screenshot" accept="image/png,image/jpeg,image/webp" onChange={event=>select(event.target.files?.[0]??null)}/>
          <div className={`drop-zone ${dragging?'dragging':''} ${file?'has-image':''}`} data-testid="drop-zone" onDragOver={event=>{event.preventDefault();setDragging(true);}} onDragLeave={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))setDragging(false);}} onDrop={event=>{
            event.preventDefault();setDragging(false);
            if(event.dataTransfer.files.length!==1){select(null);setError('Choose one screenshot at a time.');return;}
            select(event.dataTransfer.files[0]);
          }}>
            {file ? <>
              {preview && <img className="preview" src={preview} alt="Your selected screenshot"/>}
              <p className="file-name">{file.name}</p>
              <div className="image-controls"><button className="text-button" onClick={()=>input.current?.click()}>Choose another</button><span aria-hidden="true">·</span><button className="text-button" onClick={()=>select(null)}>Clear screenshot</button></div>
            </> : <>
              <div className="upload-symbol"><UploadIcon/><span className="spark spark-one">✦</span><span className="spark spark-two">✧</span></div>
              <h2>Drop your screenshot here</h2>
              <p>Or choose one from your photos.</p>
              <button className="primary-button choose-button" onClick={()=>input.current?.click()}>Choose a screenshot <span aria-hidden="true">↗</span></button>
              <span className="file-hint">PNG, JPG or WebP · up to 8 MB</span>
            </>}
          </div>
          {file && <button className="primary-button analyze-button" disabled={loading} onClick={analyze}>{loading?<><span className="spinner" aria-hidden="true"/>Reading your screenshot…</>:<>Check this message <span aria-hidden="true">→</span></>}</button>}
          <div role="status" aria-live="polite" className="loading-note">{loading?'This may take a minute or two. You can clear or change the image anytime.':''}</div>
          {error && <div className="error-message" role="alert" aria-label="Screenshot checker error"><span aria-hidden="true">!</span><p>{error}</p></div>}
          <p className="privacy-caption"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="4" y="8" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M6.5 8V5a3.5 3.5 0 0 1 7 0v3" stroke="currentColor" strokeWidth="1.5"/></svg>Your screenshot stays on this computer.<br/>No saved images. No message history.</p>
        </div>
        <aside className="guide-column" aria-labelledby="guide-title">
          <div className="guide-illustration" aria-hidden="true"><div className="note-paper"><span/><span/><span/><i>?</i></div><span className="small-star">✦</span></div>
          <h2 id="guide-title">A pause can make{' '}<br/>all the difference.</h2>
          <p className="guide-intro">You don’t have to figure it out alone.</p>
          <ol className="guide-steps">
            <li><span>1</span><div><h3>Share a screenshot</h3><p>Include the message and who it appears to be from.</p></div></li>
            <li><span>2</span><div><h3>Read the explanation</h3><p>See what it’s asking for and what looks suspicious.</p></div></li>
            <li><span>3</span><div><h3>Check another way</h3><p>Use an official app or a contact you already know.</p></div></li>
          </ol>
          <div className="guide-footnote"><span aria-hidden="true">♡</span> When in doubt, ask someone you trust.</div>
        </aside>
      </section>
      {result && <section className={`result result-${result.verdict}`} aria-labelledby="result-title">
        <div className="section-kicker"><span className="step-number">02</span> YOUR SECOND LOOK</div>
        <div className="verdict-row"><span className="verdict-symbol" aria-hidden="true">{result.verdict==='likely_scam'?'!':'?'}</span><div><h2 id="result-title" ref={resultHeading} tabIndex={-1}>{labels[result.verdict]}</h2><p>{hints[result.verdict]}</p></div></div>
        <div className="result-details"><div><h3>What this message wants</h3><p>{result.summary}</p><h3>What stood out</h3>{result.redFlags.length?<ul>{result.redFlags.map((flag,index)=><li key={index}>{flag}</li>)}</ul>:<p>No specific red flags were identified. That does not prove the message is legitimate.</p>}</div><div className="next-step"><span className="next-step-icon" aria-hidden="true">↗</span><h3>What to do next</h3><p>{result.recommendedAction}</p></div></div>
        {result.verdict==='no_obvious_red_flags' && <p className="result-disclaimer">No obvious red flags does not prove legitimacy. Check independently before taking action.</p>}
        <p className="generated-note">The explanation is generated by a local model and may get details wrong.</p>
      </section>}
      <aside className="disclaimer"><div className="disclaimer-icon" aria-hidden="true">i</div><div><h2>A helping hand, not a guarantee</h2><p>{disclaimer}</p></div></aside>
    </main>
    <footer><span>Made for the people you care about.</span><span>Uncertainty is a safety feature.</span></footer>
  </>;
}
