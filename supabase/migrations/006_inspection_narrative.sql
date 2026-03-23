-- Persist AI-generated inspection narrative per scenario (survives tab navigation)
alter table scenarios add column inspection_narrative text;
